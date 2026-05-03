import LZString from "lz-string";

import { Theme } from "../enums";
import { Question } from "../models/entities";

const THEME_KEY = "oqoa-theme";
const GOOGLE_CLIENT_ID_KEY = "oqoa-google-client-id";
const GOOGLE_FOLDER_ID_KEY = "oqoa-google-folder-id";
const GOOGLE_USER_ID_KEY = "oqoa-google-user-id";
const GOOGLE_ACCESS_TOKEN_KEY = "oqoa-google-access-token";
const GOOGLE_TOKEN_EXPIRES_AT_KEY = "oqoa-google-token-expires-at";
const AUTO_SYNC_ENABLED_KEY = "oqoa-auto-sync-enabled";
const LAST_IMPORTED_DATA_KEY = "oqoa-last-imported-data";
const LAST_USED_QUESTIONS_KEY = "oqoa-last-used-questions";

// 期限直前にネットワーク往復で 401 を踏まないためのクライアント側都合のマージン。
// Google から返る expires_in (有効秒数) には触れず、保存済みの絶対時刻からのみ差し引く。
const TOKEN_EXPIRY_SAFETY_MARGIN_MS = 60_000;

export function getTheme(): Theme | null {
  const storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme) {
    return storedTheme === "dark" ? Theme.DARK : Theme.LIGHT;
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

export function getGoogleUserId(): string | null {
  return localStorage.getItem(GOOGLE_USER_ID_KEY);
}

export function setGoogleUserId(googleUserId: string) {
  localStorage.setItem(GOOGLE_USER_ID_KEY, googleUserId);
}

export type GoogleAccessTokenRecord = {
  token: string;
  expiresAt: number;
};

export function getGoogleAccessTokenRecord(): GoogleAccessTokenRecord | null {
  const token = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
  const expiresAtRaw = localStorage.getItem(GOOGLE_TOKEN_EXPIRES_AT_KEY);
  if (!token || !expiresAtRaw) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) return null;
  return { token, expiresAt };
}

export function isGoogleAccessTokenValid(
  record: GoogleAccessTokenRecord | null,
): record is GoogleAccessTokenRecord {
  return !!record && record.expiresAt > Date.now();
}

export function setGoogleAccessToken(token: string, expiresInSec: number) {
  // expiresInSec は Google 認可サーバーが発行時に決める値 (TokenResponse.expires_in)。
  // クライアント側で固定値にせず、応答の値をそのまま使う。
  const expiresAt =
    Date.now() + expiresInSec * 1000 - TOKEN_EXPIRY_SAFETY_MARGIN_MS;
  localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, token);
  localStorage.setItem(GOOGLE_TOKEN_EXPIRES_AT_KEY, String(expiresAt));
}

export function clearGoogleAccessToken() {
  localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
  localStorage.removeItem(GOOGLE_TOKEN_EXPIRES_AT_KEY);
}

export function getAutoSyncEnabled(): boolean {
  return localStorage.getItem(AUTO_SYNC_ENABLED_KEY) === "true";
}

export function setAutoSyncEnabled(enabled: boolean) {
  localStorage.setItem(AUTO_SYNC_ENABLED_KEY, String(enabled));
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return JSON.parse(json).map((q: any) => new Question(q)) as Question[];
}

export function setLastUsedQuestions(questions: Question[]) {
  const json = JSON.stringify(questions);
  const compressed = LZString.compressToUTF16(json);
  localStorage.setItem(LAST_USED_QUESTIONS_KEY, compressed);
}
