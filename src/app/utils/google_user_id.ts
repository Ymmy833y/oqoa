export type ParsedGoogleUserId = {
  folderId: string;
  userName: string;
};

/**
 * <フォルダID>-<ユーザー名> 形式の入力をパースして folderId と userName に分割する。
 * ユーザー名はハイフン禁止・英数+アンダースコア・1〜32文字。
 */
export function parseGoogleUserId(input: string): ParsedGoogleUserId | null {
  const idx = input.lastIndexOf("-");
  if (idx <= 0 || idx >= input.length - 1) return null;
  const folderId = input.slice(0, idx);
  const userName = input.slice(idx + 1);
  if (!/^[A-Za-z0-9_]{1,32}$/.test(userName)) return null;
  return { folderId, userName };
}
