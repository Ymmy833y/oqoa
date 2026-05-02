import { ToastMessage } from "../enums";
import { AnsHistory, PracticeHistory, QList } from "../models/entities";
import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { practiceHistoryRepository } from "../repositories/practice_history_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";
import { questionRepository } from "../repositories/question_repositoriy";
import {
  generateErrorToastMessage,
  generateSuccessToastMessage,
} from "../utils";

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

type ImportHistoryPayload = {
  qLists: QListRow[];
  practiceHistories: PracticeHistoryRow[];
  ansHistories: AnsHistoryRow[];
};

type ImportResult = {
  qListInserted: number;
  qListSkipped: number;
  qListExcluded: number;
  practiceInserted: number;
  practiceSkipped: number;
  ansInserted: number;
  ansSkipped: number;
};

/**
 * 演習履歴データの JSON ファイルを取り込み、
 * QList / PracticeHistory / AnsHistory をローカル DB に登録する。
 * 既存データを正としてスキップ判定するため、洗い替えは行わない。
 * @param file ユーザーが選択したエクスポート JSON ファイル
 * @returns 成功またはエラーの ToastMessage
 */
export async function importHistory(file: File): Promise<ToastMessage> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    const payload = validatePayload(parsed);
    if (!payload) {
      return generateErrorToastMessage("インポートファイルの形式が不正です。");
    }

    const result = await processImport(payload);

    return generateSuccessToastMessage(buildResultMessage(result));
  } catch (error) {
    return generateErrorToastMessage(
      error instanceof Error ? error : String(error),
    );
  }
}

/**
 * パース済みオブジェクトが想定構造かを検証し、ImportHistoryPayload に絞り込む。
 */
function validatePayload(parsed: unknown): ImportHistoryPayload | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Partial<ImportHistoryPayload>;
  if (
    !Array.isArray(p.qLists) ||
    !Array.isArray(p.practiceHistories) ||
    !Array.isArray(p.ansHistories)
  ) {
    return null;
  }
  return p as ImportHistoryPayload;
}

/**
 * 取り込み本体。仕様:
 * - QList: uuid 一致でスキップ、questions が 1 件でもローカル設問とマッチすれば対象（空配列・全件不一致は除外）
 * - PracticeHistory: (qListId, createAt) で重複検知、qListId は uuid 経由で解決
 * - AnsHistory: (practiceHistoryId, questionId) で重複検知、practiceHistoryId は createAt 経由で解決
 */
async function processImport(
  payload: ImportHistoryPayload,
): Promise<ImportResult> {
  const localQuestionIdSet = new Set(
    questionRepository.selectAll().map((q) => q.getId()),
  );

  const excludedImportedQListIds = new Set<number>();
  const qListIdMap = new Map<number, number>();
  const result: ImportResult = {
    qListInserted: 0,
    qListSkipped: 0,
    qListExcluded: 0,
    practiceInserted: 0,
    practiceSkipped: 0,
    ansInserted: 0,
    ansSkipped: 0,
  };

  for (const ql of payload.qLists) {
    const hasAnyLocalQuestion =
      ql.questions.length > 0 &&
      ql.questions.some((qid) => localQuestionIdSet.has(qid));
    if (!hasAnyLocalQuestion) {
      excludedImportedQListIds.add(ql.id);
      result.qListExcluded++;
      continue;
    }

    const existing = await qListRepository.selectByUuid(ql.uuid);
    if (existing) {
      qListIdMap.set(ql.id, existing.getId());
      result.qListSkipped++;
      continue;
    }

    const qList = QList.fromRequiredArgs(
      ql.uuid,
      ql.name,
      ql.questions,
      ql.is_default,
    );
    const newId = (await qListRepository.insert(qList.generateRow())) as number;
    qListIdMap.set(ql.id, newId);
    result.qListInserted++;
  }

  const practiceHistoryIdMap = new Map<number, number>();

  for (const ph of payload.practiceHistories) {
    if (excludedImportedQListIds.has(ph.q_list_id)) continue;
    const localQListId = qListIdMap.get(ph.q_list_id);
    if (localQListId === undefined) continue;

    const existing = await practiceHistoryRepository.selectByQListIdAndCreateAt(
      localQListId,
      ph.create_at,
    );
    if (existing) {
      practiceHistoryIdMap.set(ph.id, existing.getId());
      result.practiceSkipped++;
      continue;
    }

    const practiceHistory = PracticeHistory.fromCsvRow(
      localQListId,
      ph.is_review,
      ph.is_answered,
      ph.is_random_q,
      ph.is_random_c,
      ph.create_at,
    );
    const newId = (await practiceHistoryRepository.insert(
      practiceHistory.generateRow(),
    )) as number;
    practiceHistoryIdMap.set(ph.id, newId);
    result.practiceInserted++;
  }

  for (const ah of payload.ansHistories) {
    const localPhId = practiceHistoryIdMap.get(ah.practice_history_id);
    if (localPhId === undefined) continue;

    const duplicated = await ansHistoryRepository.hasAnsHistory(
      localPhId,
      ah.question_id,
    );
    if (duplicated) {
      result.ansSkipped++;
      continue;
    }

    const ansHistory = AnsHistory.fromRequiredArgs(
      localPhId,
      ah.question_id,
      ah.is_correct,
      ah.select_choice,
      ah.answer_date,
    );
    await ansHistoryRepository.insert(ansHistory.generateRow());
    result.ansInserted++;
  }

  console.info("importHistory:", result);
  return result;
}

/**
 * 取り込み結果のサマリトースト文言を組み立てる。
 */
function buildResultMessage(result: ImportResult): string {
  const head =
    `演習履歴のインポートが完了しました。` +
    `問題集: ${result.qListInserted}件追加(${result.qListSkipped}件スキップ), ` +
    `演習履歴: ${result.practiceInserted}件追加(${result.practiceSkipped}件スキップ), ` +
    `解答履歴: ${result.ansInserted}件追加(${result.ansSkipped}件スキップ)`;
  if (result.qListExcluded > 0) {
    return (
      head +
      ` ※ 設問データ未保有のため ${result.qListExcluded} 件の問題集をスキップしました。`
    );
  }
  return head;
}
