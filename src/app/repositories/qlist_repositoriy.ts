import { QList } from "../models/entities";

import { BaseRepository } from "./base_repositoriy";

class QListRepository extends BaseRepository<QList> {
  constructor() {
    super("q_list");
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("uuid", "uuid", { unique: false });
      store.createIndex("name", "name", { unique: false });
      store.createIndex("questions", "questions", {
        unique: false,
        multiEntry: true,
      });
      store.createIndex("is_default", "is_default", { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertRow(row: any): QList {
    return QList.fromRow(row);
  }

  /**
   * QList を複数件まとめて登録する
   * - 既存の uuid と重複するものはスキップする
   * @returns { inserted: number, skipped: number }
   */
  async bulkInsert(
    qLists: QList[],
  ): Promise<{ inserted: number; skipped: number }> {
    // すでに DB に存在する uuid を取得
    const existing = await this.selectAll();
    const existingUuids = new Set(existing.map((q) => q.getUuid()));

    let inserted = 0;
    let skipped = 0;

    for (const qList of qLists) {
      const uuid = qList.getUuid();
      if (existingUuids.has(uuid)) {
        skipped++;
        continue;
      }

      // BaseDB 側で実装されている insert を利用
      await this.insert(qList.generateRow());

      existingUuids.add(uuid);
      inserted++;
    }

    console.info(
      `QListDB.bulkInsert: inserted=${inserted}, skipped=${skipped}`,
    );
    return { inserted, skipped };
  }

  async selectByStandard(): Promise<QList[]> {
    return (await this.selectAll()).filter((qList) => qList.getIsDefault());
  }

  async selectByUuid(uuid: string): Promise<QList | undefined> {
    const qLists = await this.selectExample("uuid", uuid);
    if (qLists.length === 0) {
      return undefined;
    }
    return qLists[0];
  }

  async selectByNameAndQuestions(
    name: string,
    questions: number[],
  ): Promise<QList | undefined> {
    const qLists = await this.selectExample("name", name);
    const filteredQLists = qLists.filter((qList) => {
      const qListQuestions = qList.getQuestions();
      if (qListQuestions.length !== questions.length) {
        return false;
      }
      return qListQuestions.every((value, index) => value === questions[index]);
    });

    if (filteredQLists.length === 0) {
      return undefined;
    }
    return filteredQLists[0];
  }
}

export const qListRepository = new QListRepository();
