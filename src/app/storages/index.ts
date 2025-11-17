import LZString from 'lz-string';
import { Question } from '../models/entities';
import { Theme } from '../types';

const THEME_KEY = 'oqoa-theme';
const GOOGLE_CLIENT_ID_KEY = 'oqoa-google-client-id';
const GOOGLE_FOLDER_ID_KEY = 'oqoa-google-folder-id';
const LAST_IMPORTED_DATA_KEY = 'oqoa-last-imported-data'
const LAST_USED_QUESTIONS_KEY = 'oqoa-last-used-questions';;

export function getTheme(): Theme | null {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme) {
    return storedTheme === 'dark' ? Theme.DARK : Theme.LIGHT;
  } else {
    return null;
  }
}

export function setTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getGoogleClientId(): string | null {
  return localStorage.getItem(GOOGLE_CLIENT_ID_KEY);
}

export function setGoogleClientId(googleClientId: string) {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, googleClientId);
}

export function getGoogleFolderId(): string | null {
  return localStorage.getItem(GOOGLE_FOLDER_ID_KEY);
}

export function setGoogleFolderId(googleFolderId: string) {
  localStorage.setItem(GOOGLE_FOLDER_ID_KEY, googleFolderId);
}

export function getLastImportedData(): Date | null {
  const isoString = localStorage.getItem(LAST_IMPORTED_DATA_KEY);
  return isoString ? new Date(isoString) : null;
}

export function setLastImportedData(data: Date) {
  localStorage.setItem(LAST_IMPORTED_DATA_KEY, data.toISOString());
}

export function getLastUsedQuestions(): Question[] | null {
  const compressed = localStorage.getItem(LAST_USED_QUESTIONS_KEY);
  if (!compressed) return null;

  const json = LZString.decompressFromUTF16(compressed);
  if (!json) return null;

  return JSON.parse(json).map((q: any) => new Question(q)) as Question[];
}

export function setLastUsedQuestions(questions: Question[]) {
  const json = JSON.stringify(questions);
  const compressed = LZString.compressToUTF16(json);
  localStorage.setItem(LAST_USED_QUESTIONS_KEY, compressed);
}
