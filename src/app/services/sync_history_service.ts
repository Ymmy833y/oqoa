import {
  createFile,
  fetchFileJson,
  findFileByName,
  listFilesInFolder,
  requestAccessTokenWithClientId,
  updateFileContent,
} from "../api/google_auth";
import { ToastMessage } from "../enums";
import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { practiceHistoryRepository } from "../repositories/practice_history_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";
import {
  generateErrorToastMessage,
  generateSuccessToastMessage,
} from "../utils";
import { parseGoogleUserId } from "../utils/google_user_id";

import { buildExportPayload } from "./export_history_service";
import { processImport, validatePayload } from "./import_history_service";

const HISTORY_FILE_PREFIX = "oqoa-history-";

function buildHistoryFileName(userName: string): string {
  return `${HISTORY_FILE_PREFIX}${userName}.json`;
}

/**
 * 疎通確認: フォーマット検証 → アクセストークン取得 → listFilesInFolder 200 チェック。
 * 成功時は accessToken を返す。
 */
export async function probeGoogleDriveSync(
  clientId: string,
  userIdInput: string,
): Promise<{ toast: ToastMessage; accessToken?: string }> {
  const parsed = parseGoogleUserId(userIdInput);
  if (!parsed) {
    return {
      toast: generateErrorToastMessage(
        "ユーザーIDの形式が正しくありません。「<フォルダID>-<ユーザー名>」の形式で入力してください。ユーザー名は英数字とアンダースコアのみ使用できます。",
      ),
    };
  }

  try {
    const accessToken = await requestAccessTokenWithClientId(clientId);
    await listFilesInFolder(accessToken, parsed.folderId);
    return {
      toast: generateSuccessToastMessage(
        "接続に成功しました。同期ボタンから演習履歴を同期できます。",
      ),
      accessToken,
    };
  } catch (error) {
    return {
      toast: generateErrorToastMessage(
        error instanceof Error ? error : String(error),
      ),
    };
  }
}

/**
 * 演習履歴の同期処理。
 * 1. Drive から履歴ファイルをDL
 * 2. ローカルにマージ
 * 3. ローカル全件をDriveへUP
 */
export async function syncHistoryWithGoogleDrive(
  clientId: string,
  userIdInput: string,
  accessToken: string,
): Promise<ToastMessage> {
  const parsed = parseGoogleUserId(userIdInput);
  if (!parsed) {
    return generateErrorToastMessage("ユーザーIDの形式が正しくありません。");
  }

  const { folderId, userName } = parsed;
  const fileName = buildHistoryFileName(userName);

  try {
    // 1. Drive から既存ファイルを検索
    let fileId: string | null = null;
    try {
      const found = await findFileByName(accessToken, folderId, fileName);
      fileId = found?.id ?? null;
    } catch {
      // listFiles 失敗 = トークン期限切れの可能性 → 再取得して再試行
      const newToken = await requestAccessTokenWithClientId(clientId);
      accessToken = newToken;
      const found = await findFileByName(accessToken, folderId, fileName);
      fileId = found?.id ?? null;
    }

    // 2. Drive から履歴をDLしてローカルにマージ
    if (fileId) {
      const remoteJson = await fetchFileJson(accessToken, fileId);
      const payload = validatePayload(remoteJson);
      if (payload) {
        await processImport(payload);
      }
    }

    // 3. ローカル全件を再構築してDriveへUP
    const [qLists, practiceHistories, ansHistories] = await Promise.all([
      qListRepository.selectAll(),
      practiceHistoryRepository.selectAll(),
      ansHistoryRepository.selectAll(),
    ]);
    const exportPayload = buildExportPayload(
      qLists,
      practiceHistories,
      ansHistories,
    );

    const payloadSize = new Blob([JSON.stringify(exportPayload)]).size;
    if (payloadSize > 4 * 1024 * 1024) {
      console.warn(
        `sync payload size: ${(payloadSize / 1024 / 1024).toFixed(1)}MB`,
      );
    }

    if (fileId) {
      await updateFileContent(accessToken, fileId, exportPayload);
    } else {
      await createFile(accessToken, folderId, fileName, exportPayload);
    }

    return generateSuccessToastMessage("演習履歴の同期が完了しました。");
  } catch (error) {
    return generateErrorToastMessage(
      error instanceof Error ? error : String(error),
    );
  }
}
