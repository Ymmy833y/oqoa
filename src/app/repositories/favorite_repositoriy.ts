import { Favorite } from "../models/entities";

import { BaseRepository } from "./base_repositoriy";

class FavoriteRepository extends BaseRepository<Favorite> {
  constructor() {
    super("favorite");
  }

  initStore(event: IDBVersionChangeEvent): void {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains(this.storeName)) {
      const store = db.createObjectStore(this.storeName, {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("question_id", "question_id", { unique: false });
      store.createIndex("tag_id", "tag_id", { unique: false });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected convertRow(row: any): Favorite {
    return Favorite.fromRow(row);
  }

  async selectByQuestionId(questionId: number): Promise<Favorite[]> {
    return await this.selectExample("question_id", questionId);
  }

  async selectByTagId(tagId: number): Promise<Favorite[]> {
    return await this.selectExample("tag_id", tagId);
  }

  async selectByQuestionIdAndTagId(
    questionId: number,
    tagId: number,
  ): Promise<Favorite | undefined> {
    const favorites = await this.selectExample("question_id", questionId);
    return favorites.find((f) => f.getTagId() === tagId);
  }
}

export const favoriteRepository = new FavoriteRepository();
