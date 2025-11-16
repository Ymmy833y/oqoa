import { Theme } from '../types';

export enum Effect {
  INIT_REPOSITORY = 'INIT_REPOSITORY',
  UPDATE_THEME = 'UPDATE_THEME',
  UPDATE_GOOGLE_CLIENT_ID = 'UPDATE_GOOGLE_CLIENT_ID',
  UPDATE_GOOGLE_FOLDER_ID = 'UPDATE_GOOGLE_FOLDER_ID',
  IMPORT_GOOGLE_DRIVE = 'IMPORT_GOOGLE_DRIVE',
  SEARCH_QUESTION = 'SEARCH_QUESTION',
}

export type EffectType =
  | { kind: Effect.INIT_REPOSITORY; }
  | { kind: Effect.UPDATE_THEME; theme: Theme }
  | { kind: Effect.UPDATE_GOOGLE_CLIENT_ID; googleClientId: string }
  | { kind: Effect.UPDATE_GOOGLE_FOLDER_ID; googleFolderId: string }
  | { kind: Effect.IMPORT_GOOGLE_DRIVE; googleClientId: string; googleFolderId: string }
  | { kind: Effect.SEARCH_QUESTION }
;
