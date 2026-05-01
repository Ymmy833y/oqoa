import { el } from "./view_utils";

const JSON_INDENT_SPACE = 2;

/**
 * JSON データをファイルとしてダウンロードする。
 * @param payload ダウンロードするデータ
 * @param fileName ダウンロードファイル名
 */
export function downloadJsonFile(payload: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(payload, null, JSON_INDENT_SPACE)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = el("a", { attr: [{ href: url }, { download: fileName }] });
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * タイムスタンプ付きのファイル名を生成する。
 * @param prefix ファイル名のプレフィックス
 * @param extension 拡張子（ドットなし）
 * @returns `${prefix}YYYYMMDD-HHmmss.${extension}` 形式のファイル名
 */
export function generateTimestampedFileName(
  prefix: string,
  extension: string,
): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${prefix}${yyyy}${MM}${dd}-${HH}${mm}${ss}.${extension}`;
}
