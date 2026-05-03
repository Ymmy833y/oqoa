import { ToastMessage } from "../enums";
import { AnsHistory, PracticeHistory, QList } from "../models/entities";
import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { practiceHistoryRepository } from "../repositories/practice_history_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";
import {
  downloadJsonFile,
  generateErrorToastMessage,
  generateSuccessToastMessage,
  generateTimestampedFileName,
} from "../utils";

const EXPORT_SCHEMA_VERSION = 1;
const EXPORT_FILE_NAME_PREFIX = "oqoa-history-";

type QListRow = {
  id: number;
  uuid: string;
  name: string;
  questions: number[];
  is_default: boolean;
};

type PracticeHistoryRow = {
  id: number;
  q_list_id: number;
  is_review: boolean;
  is_answered: boolean;
  is_random_q: boolean;
  is_random_c: boolean;
  create_at: string;
};

type AnsHistoryRow = {
  id: number;
  practice_history_id: number;
  question_id: number;
  is_correct: boolean;
  select_choice: number[];
  answer_date: string;
};

export type ExportHistoryPayload = {
  schemaVersion: number;
  exportedAt: string;
  qLists: QListRow[];
  practiceHistories: PracticeHistoryRow[];
  ansHistories: AnsHistoryRow[];
};

/**
 * 演習履歴データを JSON ファイルとしてエクスポートする。
 * QList / PracticeHistory / AnsHistory の全件を含む。
 * @returns 成功またはエラーの ToastMessage
 */
export async function exportHistory(): Promise<ToastMessage> {
  try {
    const [qLists, practiceHistories, ansHistories] = await Promise.all([
      qListRepository.selectAll(),
      practiceHistoryRepository.selectAll(),
      ansHistoryRepository.selectAll(),
    ]);

    const payload = buildExportPayload(qLists, practiceHistories, ansHistories);
    const fileName = generateTimestampedFileName(
      EXPORT_FILE_NAME_PREFIX,
      "json",
    );
    downloadJsonFile(payload, fileName);

    return generateSuccessToastMessage(
      "演習履歴のエクスポートが完了しました。",
    );
  } catch (error) {
    return generateErrorToastMessage(
      error instanceof Error ? error : String(error),
    );
  }
}

/**
 * 各エンティティ配列からエクスポート用ペイロードを構築する。
 * @param qLists QList エンティティの配列
 * @param practiceHistories PracticeHistory エンティティの配列
 * @param ansHistories AnsHistory エンティティの配列
 * @returns エクスポート用ペイロード
 */
export function buildExportPayload(
  qLists: QList[],
  practiceHistories: PracticeHistory[],
  ansHistories: AnsHistory[],
): ExportHistoryPayload {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    qLists: qLists.map((q) => q.generateRow() as QListRow),
    practiceHistories: practiceHistories.map(
      (p) => p.generateRow() as PracticeHistoryRow,
    ),
    ansHistories: ansHistories.map((a) => a.generateRow() as AnsHistoryRow),
  };
}
