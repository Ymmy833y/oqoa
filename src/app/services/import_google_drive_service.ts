import { fetchAllJsonFromFolderStrict, requestAccessTokenWithClientId } from '../api/google_auth';
import { QList, Question } from '../models/entities';
import { qListRepository } from '../repositories/qlist_repositoriy';
import { questionRepository } from '../repositories/question_repositoriy';
import { setLastImportedData, setLastUsedQuestions } from '../storages';
import { ToastMessage, ToastMessageKind } from '../enums';

export async function importProbelmForGoogleDrive(clientId: string, folderId: string): Promise<ToastMessage> {
  try {
    // Google Identity Services のトークン取得
    const accessToken = await requestAccessTokenWithClientId(clientId);

    // Drive から JSON 群を取得（ショートカット解決・Docs除外・JSONのみ）
    const files = await fetchAllJsonFromFolderStrict(accessToken, folderId);
    if (!files.length) {
      return {
        uuid: crypto.randomUUID(),
        message: '対象フォルダに JSON ファイルが見つかりませんでした。',
        kind: ToastMessageKind.SUCCESS
      };
    }

    // すべての JSON をドメインオブジェクトへ変換
    const { questions, qLists } = convertPayloadsToDomain(files.map(f => f.content));

    // ここでアプリ側の保存処理や state 反映へ渡す
    console.info(`Imported: questions=${questions.length}, qLists=${qLists.length}`);
    questionRepository.bulkInsert(questions);
    setLastUsedQuestions(questionRepository.selectAll());
    setLastImportedData(new Date());
    await qListRepository.bulkInsert(qLists);
    return {
      uuid: crypto.randomUUID(),
      message: '問題のインポートが完了しました。',
      kind: ToastMessageKind.SUCCESS
    };
  } catch (error) {
    return {
      uuid: crypto.randomUUID(),
      message: String(error),
      kind: ToastMessageKind.ERROR
    };
  }
}

/**
 * Drive から取得した JSON 群を Question / QList に変換
 * payload 仕様:
 * {
 *   qLists: [{ name, isDefault, questions: number[] }, ...],
 *   questions: [{ id, url, problem, choice[], selectionFormat, answer[], explanation }, ...]
 * }
 */
function convertPayloadsToDomain(payloads: unknown[]): {
  questions: Question[];
  qLists: QList[];
} {
  const questionMap = new Map<number, Question>();
  const qLists: QList[] = [];

  for (const p of payloads) {
    if (!p || typeof p !== 'object') continue;

    const payload = p as {
      qLists?: { name: string; isDefault: boolean; questions: number[] }[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions?: any[];
    };

    // Questions: id 重複は「後勝ち」で上書き
    if (Array.isArray(payload.questions)) {
      for (const row of payload.questions) {
        if (!row || typeof row !== 'object') continue;
        if (typeof row.id !== 'number') continue;
        questionMap.set(row.id, new Question(row));
      }
    }

    // QLists: id を持たない想定
    if (Array.isArray(payload.qLists)) {
      for (const ql of payload.qLists) {
        if (!ql || typeof ql.name !== 'string' || !Array.isArray(ql.questions)) continue;
        const list = QList.fromRow(ql);
        qLists.push(list);
      }
    }
  }

  return {
    questions: Array.from(questionMap.values()),
    qLists,
  };
}
