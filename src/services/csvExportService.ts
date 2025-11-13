import { ansHistoryDB } from '../db/AnsHistoryDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { CSV_HEADER, CsvRow } from '../models/CsvRow';

// CSV用の値エスケープ処理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function escapeCsv(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = value.toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // ダブルクォートが含まれている場合は""に置換して、全体をダブルクォートで囲む
    str = '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// DBからデータを取得してCsvRowの配列を生成する処理
async function generateCsv(): Promise<CsvRow[]> {
  const csvRows: CsvRow[] = [];
  const qLists = await qListDB.selectAll();
  for (const qList of qLists) {
    const practiceHistories = await practiceHistoryDB.selectByQListId(qList.getId());
    for (const practiceHistory of practiceHistories) {
      const ansHistories = await ansHistoryDB.selectByPracticeHistoryId(practiceHistory.getId());
      for (const ansHistory of ansHistories) {
        csvRows.push(CsvRow.fromTable(qList, practiceHistory, ansHistory));
      }
      console.log(`QList: ${qList.getName()}, PracticeHistory: ${practiceHistory.getId()}, AnsHistories: ${ansHistories.length}`);
      if (ansHistories.length === 0) {
        csvRows.push(CsvRow.fromTableForUndefined(qList, practiceHistory));
      }
    }
  }
  return csvRows;
}

async function generateCsvFile(): Promise<Blob> {
  // CsvRowの配列を取得
  const csvRows = await generateCsv();

  // ヘッダーをエスケープしてCSV文字列の1行目にする
  let csvContent = CSV_HEADER.map(escapeCsv).join(',') + '\n';

  // 各CsvRowインスタンスからデータを取得し、1行ずつCSV文字列に追加する
  csvRows.forEach(row => {
    const rowData = [
      row.getPracticeHistoryId(),
      row.getQuestionId(),
      row.getIsCorrect(),
      Array.isArray(row.getSelectChoice()) ? row.getSelectChoice().join(';') : row.getSelectChoice(),
      row.getAnswerDate(),
      row.getQListId(),
      row.getIsReview(),
      row.getIsAnswered(),
      row.getIsRandomQ(),
      row.getIsRandomC(),
      row.getCreateAt(),
      row.getQuestionUuid(),
      row.getName(),
      Array.isArray(row.getQuestions()) ? row.getQuestions().join(';') : row.getQuestions(),
      row.getIsUndeliteable()
    ];
    csvContent += rowData.map(escapeCsv).join(',') + '\n';
  });

  // BOMを追加してBlobを生成（BOM追加によりExcelでの日本語文字化けが解消される）
  const BOM = '\uFEFF';
  return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
}


// CSVファイルを生成し、ダウンロードを実行する処理
export async function exportCsv() {
  const blob = await generateCsvFile();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'export.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
