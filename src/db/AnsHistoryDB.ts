import { BaseDB } from './BaseDB';
import { AnsHistory } from '../models/AnsHistory';

class AnsHistoryDB extends BaseDB<AnsHistory> {
  constructor() {
    super('ans_history');
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
      store.createIndex('practice_history_id', 'practice_history_id', { unique: false });
      store.createIndex('question_id', 'question_id', { unique: false });
      store.createIndex('is_current', 'is_current', { unique: false });
      store.createIndex('select_choice', 'select_choice', { unique: false, multiEntry: true });
      store.createIndex('answer_date', 'answer_date', { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertRow(row: any): AnsHistory {
    return AnsHistory.fromRow(row);
  }

  async selectByPracticeHistoryId(practiceHistoryId: number): Promise<AnsHistory[]> {
    return await this.selectExample('practice_history_id', practiceHistoryId);
  }

  async selectByQuestionId(questionId: number): Promise<AnsHistory[]> {
    return await this.selectExample('question_id', questionId);
  }

  async selectAllOrderDesc(): Promise<AnsHistory[]> {
    return (await this.selectAll()).sort((p1, p2) =>
      p2.getId() - p1.getId()
    );
  }

  async hasAnsHistory(practiceHistoryId: number, questionId: number): Promise<boolean> {
    const results = await this.selectExample('practice_history_id', practiceHistoryId);
    return results.some(ansHistory => ansHistory.getQuestionId() === questionId);
  }

  async hasCorrectAnsHistory(practiceHistoryId: number, questionId: number): Promise<boolean> {
    const results = await this.selectExample('practice_history_id', practiceHistoryId);
    return results.some(ansHistory => ansHistory.getIsCorrect() && ansHistory.getQuestionId() === questionId);
  }

  async deleteByPracticeHistoryId(practiceHistoryId: number): Promise<void> {
    const results = await this.selectExample('practice_history_id', practiceHistoryId);
    for (const ansHistory of results) {
      await this.deleteById(ansHistory.getId());
    }
  }
}

export const ansHistoryDB = new AnsHistoryDB();
