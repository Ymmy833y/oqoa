import { qListDB } from '../db/QListDB';
import { questionDB } from '../db/QuestionDB';
import { QList, Question } from '../models';
import { GDriveStorageKeys } from '../utils/googleDriveKey';
import { fetchAllJsonFromFolderStrict, requestAccessTokenWithClientId } from './googleAuth';

export async function importProbelmForGoogleDrive(clientId: string, folderId: string) {
  // Google Identity Services のトークン取得
  const accessToken = await requestAccessTokenWithClientId(clientId);

  // Drive から JSON 群を取得（ショートカット解決・Docs除外・JSONのみ）
  const files = await fetchAllJsonFromFolderStrict(accessToken, folderId);
  if (!files.length) {
    alert('対象フォルダに JSON ファイルが見つかりませんでした。');
    return;
  }

  // すべての JSON をドメインオブジェクトへ変換
  const { questions, qLists } = convertPayloadsToDomain(files.map(f => f.content));

  // ここでアプリ側の保存処理や state 反映へ渡す
  console.info(`Imported: questions=${questions.length}, qLists=${qLists.length}`);
  console.debug({ questions, qLists });
  await questionDB.bulkInsert(questions);
  await qListDB.bulkInsert(qLists);
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

export async function initGoogleDriveApi() {
  const clientId = localStorage.getItem(GDriveStorageKeys.clientId) ?? '';
  const folderId = localStorage.getItem(GDriveStorageKeys.folderId) ?? '';
  if (!clientId) {
    console.warn('client_id が未設定です。')};
  if (!folderId) {
    console.warn('folderId が未設定です。')
  };
  await importProbelmForGoogleDrive(clientId, folderId);
}
