import { DB_NAME, DB_VERSION } from '../db/BaseDB';
import { ansHistoryDB } from '../db/AnsHistoryDB';
import { favoriteDB } from '../db/FavoriteDB';
import { practiceHistoryDB } from '../db/PracticeHistoryDB';
import { qListDB } from '../db/QListDB';
import { questionDB } from '../db/QuestionDB';

/**
 * データベースの初期化処理
 */
function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      ansHistoryDB.initStore(event);
      favoriteDB.initStore(event);
      practiceHistoryDB.initStore(event);
      qListDB.initStore(event);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onsuccess = async (_: any) => {
      console.log('DB connected successfully');
      try {
        await questionDB.loadDataFromObjects([]);
        console.log('Questions loaded successfully');
      } catch (error) {
        console.error('Failed to load questions data:', error);
      }
      resolve();
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.onerror = (event: any) => {
      console.error('DB connection error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * 初期化
 */
export async function initDatabaseAndMigrate(): Promise<void> {
  try {
    await initDatabase();
    console.log('Database initialized.');
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

export async function deleteAllDBs(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      console.log('Database deleted successfully.');
      resolve();
    };
    request.onerror = (event) => {
      console.error('Error deleting database:', event);
      reject(event);
    };
    request.onblocked = () => {
      console.warn('Database deletion is blocked. Please close all other tabs using this site.');
    };
  });
}
