/**
 * JSON ファイルをユーザーに選択させる。
 * `<input type="file">` を一時生成してクリックする。
 * キャンセル時は `null` を返す環境もあるが、ブラウザによっては Promise が
 * 解決されないこともあるため、呼び出し側で UI 上の救済を用意すること。
 * @returns 選択された File、未選択の場合は null
 */
export function pickJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.addEventListener("change", () => {
      resolve(input.files?.[0] ?? null);
    });
    input.click();
  });
}
