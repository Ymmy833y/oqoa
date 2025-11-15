import { PracticeHistory } from '../models/entities';
import { BaseRepository } from './base_repositoriy';

class PracticeHistoryRepository extends BaseRepository<PracticeHistory> {
  constructor() {
    super('practice_history');
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
      store.createIndex('q_list_id', 'q_list_id', { unique: false });
      store.createIndex('is_review', 'is_review', { unique: false });
      store.createIndex('is_answered', 'is_answered', { unique: false });
      store.createIndex('is_random_q', 'is_random_q', { unique: false });
      store.createIndex('is_random_c', 'is_random_c', { unique: false });
      store.createIndex('create_at', 'create_at', { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertRow(row: any): PracticeHistory {
    return PracticeHistory.fromRow(row);
  }

  async selectAllOrderDesc(): Promise<PracticeHistory[]> {
    return (await this.selectAll()).sort((p1, p2) =>
      Date.parse(p2.getCreateAt()) - Date.parse(p1.getCreateAt())
    );
  }

  async selectByQListId(qListId: number): Promise<PracticeHistory[]> {
    return await this.selectExample('q_list_id', qListId);
  }

  async selectByQListIdAndCreateAt(qListId: number, createAt: string): Promise<PracticeHistory | undefined> {
    const practiceHistories = await this.selectByQListId(qListId);
    const filteredPracticeHistories = practiceHistories.filter(ph => ph.getCreateAt() === createAt);
    if (filteredPracticeHistories.length === 0) {
      return undefined;
    }
    return filteredPracticeHistories[0];
  }
}

export const practiceHistoryRepository = new PracticeHistoryRepository();
