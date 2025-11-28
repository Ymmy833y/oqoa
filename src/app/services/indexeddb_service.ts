import { ansHistoryRepository } from "../repositories/ans_history_repository";
import { DB_NAME, DB_VERSION } from "../repositories/base_repositoriy";
import { favoriteRepository } from "../repositories/favorite_repositoriy";
import { practiceHistoryRepository } from "../repositories/practice_history_repositoriy";
import { qListRepository } from "../repositories/qlist_repositoriy";

export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      ansHistoryRepository.initStore(event);
      favoriteRepository.initStore(event);
      practiceHistoryRepository.initStore(event);
      qListRepository.initStore(event);
    };

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
