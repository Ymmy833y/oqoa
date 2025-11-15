import { Theme } from '../types';

const THEME_KEY = 'oqoa-theme';
const GOOGLE_CLIENT_ID_KEY = 'oqoa-google-client-id';
const GOOGLE_FOLDER_ID_KEY = 'oqoa-google-folder-id';

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
