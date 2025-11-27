/* eslint-disable @typescript-eslint/no-explicit-any */
export const DB_NAME = "oqoa";
export const DB_VERSION = 2;

export abstract class BaseRepository<T> {
  protected storeName: string;

  constructor(storeName: string) {
    this.storeName = storeName;
  }

  /**
   * IndexedDB への接続処理。DB のオープンと、onupgradeneeded 時のストア初期化を行う。
   */
  protected openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        this.initStore(event);
      };
      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };
      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * DB のアップグレード時（初回作成またはバージョン変更時）に各 objectStore を初期化するためのメソッド。
   * 各派生クラスで、ストア作成とインデックス設定の実装を行う。
   */
  abstract initStore(event: IDBVersionChangeEvent): void;

  /**
   * Raw なオブジェクトをエンティティ T に変換するメソッド。
   * 各 DB クラス側で、変換処理を実装してください。
   */
  protected abstract convertRow(row: any): T;

  /**
   * 新規データの挿入
   */
  async insert(data: T): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 既存データの更新
   */
  async update(data: T): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ID によるデータの削除
   */
  async deleteById(id: number): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * ID によるデータの取得。取得結果は convertRow を通じてエンティティに変換される。
   */
  async selectById(id: number): Promise<T> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = (e: any) => {
        const result = e.target.result;
        if (result !== undefined) {
          resolve(this.convertRow(result));
        } else {
          reject(new Error("No data found"));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 全件取得。取得結果は convertRow を通じてエンティティに変換される。
   */
  async selectAll(): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = (e: any) => {
        const results = e.target.result.map((row: any) => this.convertRow(row));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 特定のインデックスの値で絞り込んでデータを取得するメソッド
   */
  protected async selectExample(indexName: string, value: any): Promise<T[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = (e: any) => {
        const results = e.target.result.map((row: any) => this.convertRow(row));
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
