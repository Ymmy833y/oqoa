import { ansHistoryDB } from '../db/AnsHistoryDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { AnsHistory, PracticeHistory, QList } from '../models';
import { CsvRow, CSV_HEADER } from '../models/CsvRow';

interface PracticeHistorySet {
  practiceHistory: PracticeHistory,
  ansHistories: AnsHistory[],
}

interface QListSet {
  qList: QList,
  practiceHistorySetMap: Map<number, PracticeHistorySet>,
}

// CSVファイルをインポートして CsvRow の配列を返す処理
export async function importCsv(file: File): Promise<void> {
  const csvRows = await convertToCsvRows(file);

  const qListSetMap = new Map<number, QListSet>();
  csvRows.forEach(csvRow => {
    const qListId = csvRow.getQListId();
    const qList = QList.fromRequiredArgs(csvRow.getQuestionUuid(), csvRow.getName(), csvRow.getQuestions(), csvRow.getIsUndeliteable());
    const practiceHistory = PracticeHistory.fromCsvRow(
      csvRow.getQListId(),
      csvRow.getIsReview(),
      csvRow.getIsAnswered(),
      csvRow.getIsRandomQ(),
      csvRow.getIsRandomC(),
      csvRow.getCreateAt(),
    );
    const ansHistory = AnsHistory.fromRequiredArgs(
      csvRow.getPracticeHistoryId(),
      csvRow.getQuestionId(),
      csvRow.getIsCorrect(),
      csvRow.getSelectChoice(),
      csvRow.getAnswerDate()
    );

    const qListSet = qListSetMap.get(qListId);
    if (!qListSet) {
      const practiceHistorySet = { practiceHistory, ansHistories: [ansHistory]};
      const practiceHistorySetMap = new Map([[ansHistory.getPracticeHistoryId(), practiceHistorySet]]);
      qListSetMap.set(qListId, { qList, practiceHistorySetMap });
      return;
    }

    const practiceHistorySetMap = qListSet.practiceHistorySetMap;
    const practiceHistorySet = practiceHistorySetMap.get(ansHistory.getPracticeHistoryId());
    if (practiceHistorySet) {
      practiceHistorySet.ansHistories.push(ansHistory);
    } else {
      practiceHistorySetMap.set(ansHistory.getPracticeHistoryId(), { practiceHistory, ansHistories: [ansHistory] })
    }
  });

  for (const [_, qListSet] of qListSetMap) {
    const optionalQList = (qListSet.qList.getUuid() === '') ?
      await qListDB.selectByNameAndQuestions(qListSet.qList.getName(), qListSet.qList.getQuestions()) :
      await qListDB.selectByUuid(qListSet.qList.getUuid());
    if (optionalQList) {
      const qListId = optionalQList.getId();
      for (const [_, practiceHistorySet] of qListSet.practiceHistorySetMap) {
        const optionalPracticeHistory = await practiceHistoryDB.selectByQListIdAndCreateAt(
          qListId, practiceHistorySet.practiceHistory.getCreateAt()
        );
        if (!optionalPracticeHistory) {
          await insertPracticeHistorySet(qListId, practiceHistorySet);
        } else {
          const existQuestionIds = (await ansHistoryDB.selectByPracticeHistoryId(optionalPracticeHistory.getId()))
            .map(ah => ah.getQuestionId());
          const insertableAnsHistories = practiceHistorySet.ansHistories.filter(ah => !existQuestionIds.includes(ah.getQuestionId()));
          for (const ansHistory of insertableAnsHistories) {
            ansHistory.setPracticeHistoryId(optionalPracticeHistory.getId());
            if (ansHistory.getQuestionId() !== 0) {
              await ansHistoryDB.insert(ansHistory.generateRow());
            } else {
              console.info(`QuestionIdが0のAnsHistoryはスキップされました: ${JSON.stringify(ansHistory)}`);
            }
          }
        }
      }
    } else {
      const qListId = await qListDB.insert(qListSet.qList.generateRow());
      for (const [_, practiceHistorySet] of qListSet.practiceHistorySetMap) {
        await insertPracticeHistorySet(qListId, practiceHistorySet);
      }
    }
  }
}

async function insertPracticeHistorySet(qListId: number, practiceHistorySet: PracticeHistorySet) {
  const practiceHistory = practiceHistorySet.practiceHistory;
  practiceHistory.setQListId(qListId);
  const practiceHistoryId = await practiceHistoryDB.insert(practiceHistory.generateRow());
  for (const ansHistory of practiceHistorySet.ansHistories) {
    ansHistory.setPracticeHistoryId(practiceHistoryId);
    if (ansHistory.getQuestionId() !== 0) {
      await ansHistoryDB.insert(ansHistory.generateRow());
    } else {
      console.info(`QuestionIdが0のAnsHistoryはスキップされました: ${JSON.stringify(ansHistory)}`);
    }
  }
}

// CSV行パーサー（引用符で囲まれたフィールドも考慮）
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        // 連続するダブルクォートはエスケープと判断
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function convertToCsvRows(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // ファイル内容を文字列として取得（BOMがあれば除去）
        const text = (event.target?.result as string).replace(/^\uFEFF/, '');
        // 改行コードで分割し、空行を除去
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) {
          reject(new Error('エラー: 空のCSVファイルです'));
          return;
        }

        // ヘッダー行のパース
        const headerColumns = parseCsvLine(lines[0]).map(col => col.trim());
        const headerValid =
          CSV_HEADER.length === headerColumns.length &&
          CSV_HEADER.every((col, index) => col === headerColumns[index]);
        if (!headerValid) {
          reject(new Error('エラー: CSVのヘッダーが正しくありません'));
          return;
        }

        const csvRows: CsvRow[] = [];
        // ヘッダー以降の各行をパース
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === '') continue;
          const columns = parseCsvLine(line);
          if (columns.length !== CSV_HEADER.length) continue;

          // 型変換（各項目は export 時と同じ順序・型を前提）
          const practiceHistoryId = Number(columns[0]);
          const questionId = Number(columns[1]);
          const isCorrect = columns[2].toLowerCase() === 'true';
          // selectChoice: セミコロン区切りの数値配列
          const selectChoice = columns[3] ? columns[3].split(';').map(x => Number(x)) : [];
          const answerDate = columns[4];
          const qListId = Number(columns[5]);
          const isReview = columns[6].toLowerCase() === 'true';
          const isAnswered = columns[7].toLowerCase() === 'true';
          const isRandomQ = columns[8].toLowerCase() === 'true';
          const isRandomC = columns[9].toLowerCase() === 'true';
          const createAt = columns[10];
          const questionUuid = columns[11];
          const name = columns[12];
          // questions: セミコロン区切りの数値配列
          const questions = columns[13] ? columns[13].split(';').map(x => Number(x)) : [];
          const isUndeliteable = columns[14].toLowerCase() === 'true';

          // CsvRow インスタンス生成（CsvRowクラスは全パラメータを受け取る仕様）
          const csvRow = new CsvRow(
            practiceHistoryId,
            questionId,
            isCorrect,
            selectChoice,
            answerDate,
            qListId,
            isReview,
            isAnswered,
            isRandomQ,
            isRandomC,
            createAt,
            questionUuid,
            name,
            questions,
            isUndeliteable
          );
          csvRows.push(csvRow);
        }
        resolve(csvRows);
      } catch (error) {
        console.error(error);
        reject(new Error('エラー: CSVのパース中に問題が発生しました'));
      }
    };

    reader.onerror = () => {
      reject(new Error('エラー: CSVファイルの読み込み中に問題が発生しました'));
    };

    reader.readAsText(file, 'utf-8');
  });
}
