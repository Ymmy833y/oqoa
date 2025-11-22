import { el } from './view_utils';

export const PAGE_ITEM_SIZE = 25;

/**
 * ページネーションで表示するページ番号（0 始まり）を返す
 *
 * @param currentPage 現在表示中のページ番号（0 始まり）
 * @param totalPage   合計ページ数
 * @param pageCount   ページネーションに表示する最大件数
 */
export function getPaginationPages(
  currentPage: number,
  totalPage: number,
  pageCount = 7,
): number[] {
  // 異常系
  if (totalPage <= 0 || pageCount <= 0) return [];

  // ページが 1 個だけなら 0 固定
  if (totalPage === 1) return [0];

  // currentPage を範囲内に補正
  const last = totalPage - 1;
  const current = Math.min(Math.max(currentPage, 0), last);

  // 全ページ数が pageCount 以下なら全部出す
  if (totalPage <= pageCount) {
    return Array.from({ length: totalPage }, (_, i) => i);
  }

  // pageCount が 1 のときは current だけ出す
  if (pageCount === 1) {
    return [current];
  }

  // 0（先頭）と last（末尾）を必ず表示するので、
  // 中央部分として使える枠は pageCount - 2
  const middleCount = pageCount - 2;

  // 中央部分が 0 以下なら、両端だけ
  if (middleCount <= 0) {
    // totalPage >= 2 は保証されている
    return [0, last];
  }

  // 中央部分を current を中心に配置する
  let start = current - Math.floor(middleCount / 2);
  let end = start + middleCount - 1;

  // 左端に寄せる（1 未満はダメ：0 は先頭専用）
  if (start < 1) {
    start = 1;
    end = start + middleCount - 1;
  }

  // 右端に寄せる（last は末尾専用なので last-1 まで）
  if (end > last - 1) {
    end = last - 1;
    start = end - middleCount + 1;
  }

  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return [0, ...middle, last];
}

export function renderPagination(
  parentElem: HTMLElement,
  currentPage: number,
  pages: number[],
  itemSize: number,
  totalSize: number,
  handler: (page: number) => void,
) {
  // 一旦クリア
  parentElem.innerHTML = '';

  // ページボタン用コンテナ
  const paginationContainer = el('div', 'pagination');

  for (const page of pages) {
    const attrs: Record<string, string>[] = [
      { type: 'button' },
      { 'data-page': String(page) },
    ];

    if (page === currentPage) {
      attrs.push({ 'aria-current': 'page' });
    }

    const btn = el('button', {
      class: 'page-btn',
      text: String(page + 1), // 0始まり → 表示は 1,2,3...
      attr: attrs,
    });

    btn.addEventListener('click', () => {
      if (page === currentPage) return;
      handler(page);
    });

    paginationContainer.appendChild(btn);
  }

  // 合計アイテム数表示
  const totalLabel = el('div', {
    class: 'pagination-total',
    text: `${itemSize.toLocaleString()} / ${totalSize.toLocaleString()} 件`,
  });

  parentElem.appendChild(paginationContainer);
  parentElem.appendChild(totalLabel);
}
