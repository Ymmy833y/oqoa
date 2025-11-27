/**
 * ページネーションのコンテンツを生成する関数
 * - 最大9個のページボタンを生成します（総ページ数が9未満の場合はその数に合わせる）
 * - 現在のページには特別なスタイルを適用
 *
 * @param currentPage 現在のページ番号
 * @param totalPages 総ページ数
 * @returns ページネーションを含む HTMLElement
 */
export function generatePagination(currentPage: number, totalPages: number): HTMLElement {
  const container: HTMLElement = document.createElement('div');
  container.className = 'flex justify-center space-x-2 my-2';

  const maxButtons = 7;

  const renderButtons = (page: number) => {
    container.innerHTML = '';

    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const button: HTMLButtonElement = document.createElement('button');
      button.textContent = i.toString();
      button.className = 'px-3 py-1 border rounded ' +
        (i === page ?
          'bg-blue-500 dark:bg-blue-600 text-white' :
          'bg-white dark:bg-gray-800 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700');

      button.addEventListener('click', () => {
        const event = new CustomEvent('pageChange', { detail: { page: i } });
        container.dispatchEvent(event);
        renderButtons(i);
      });

      container.appendChild(button);
    }
  };

  renderButtons(currentPage);

  return container;
}

export interface SortOption {
  key: string;
  displayName: string;
  default?: boolean;
  isAscendingDefault?: boolean;
}

export function generateSortOption(options: SortOption[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'flex gap-2 mb-4';

  const defaultOption = options.find(opt => opt.default) || options[0];
  let currentSortKey = defaultOption.key;
  let isAscending = defaultOption.isAscendingDefault ?? true;

  const buttonMap = new Map<string, { button: HTMLButtonElement; arrow: HTMLSpanElement }>();

  const updateButtons = () => {
    buttonMap.forEach(({ arrow }, key) => {
      arrow.textContent = key === currentSortKey ? (isAscending ? ' ▲' : ' ▼') : '';
    });
  };

  options.forEach(({ key, displayName }) => {
    const button = document.createElement('button');
    button.className = 'px-3 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700';

    const textSpan = document.createElement('span');
    textSpan.textContent = displayName;

    const arrowSpan = document.createElement('span');
    arrowSpan.textContent = '';

    button.appendChild(textSpan);
    button.appendChild(arrowSpan);

    button.addEventListener('click', () => {
      if (currentSortKey === key) {
        isAscending = !isAscending;
      } else {
        currentSortKey = key;
        isAscending = true;
      }
      updateButtons();
      container.dispatchEvent(new CustomEvent('sortChange', {
        detail: { key: currentSortKey, isAsc: isAscending },
        bubbles: true,
      }));
    });

    buttonMap.set(key, { button, arrow: arrowSpan });
    container.appendChild(button);
  });

  updateButtons();
  return container;
}

/**
 * オプション項目の HTML 要素を生成するヘルパー関数
 * @param id チェックボックスの id 属性
 * @param labelText 表示するラベルテキスト
 * @returns オプション項目のラベル要素（チェックボックスとテキストを含む）
 */
export function createOption(id: string, labelText: string): HTMLElement {
  const label: HTMLLabelElement = document.createElement('label');
  label.className = 'flex items-center space-x-2 cursor-pointer';

  const checkbox: HTMLInputElement = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = id;
  // Tailwind CSS を利用したシンプルなスタイル（必要に応じてアイコンを組み合わせても良い）
  checkbox.className = 'form-checkbox h-4 w-4 text-blue-600';

  const span: HTMLSpanElement = document.createElement('span');
  span.className = 'text-gray-700 dark:text-gray-100';
  span.textContent = labelText;

  label.appendChild(checkbox);
  label.appendChild(span);

  return label;
}

/**
 * 正解率（0～1）を元に、円グラフを生成して返します。
 * @param percentage 正解率（0～1）
 * @param size
 * @returns 円グラフの SVG 要素
 */
export function createPieChart(percentage: number, size = 100): SVGSVGElement {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', size.toString());
  svg.setAttribute('height', size.toString());

  // 円グラフの中心座標と半径
  const cx = size / 2;
  const cy = size / 2;
  // 半径はサイズに応じて決定（ここでは10px分の余白を確保）
  const r = (size / 2) - 10;
  const circumference = 2 * Math.PI * r;

  // 背景円（薄いグレー）
  const bgCircle = document.createElementNS(svgNS, 'circle');
  bgCircle.setAttribute('cx', cx.toString());
  bgCircle.setAttribute('cy', cy.toString());
  bgCircle.setAttribute('r', r.toString());
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', '#e5e7eb'); // Tailwind gray-200
  bgCircle.setAttribute('stroke-width', '20');
  svg.appendChild(bgCircle);

  // 前景円（正解割合を示す、緑系）
  const fgCircle = document.createElementNS(svgNS, 'circle');
  fgCircle.setAttribute('cx', cx.toString());
  fgCircle.setAttribute('cy', cy.toString());
  fgCircle.setAttribute('r', r.toString());
  fgCircle.setAttribute('fill', 'none');
  fgCircle.setAttribute('stroke', '#34d399'); // Tailwind green-400
  fgCircle.setAttribute('stroke-width', '20');
  fgCircle.setAttribute('stroke-dasharray', circumference.toString());
  fgCircle.setAttribute('stroke-dashoffset', (circumference * (1 - percentage)).toString());
  // 回転して上からスタートするよう -90 度回転
  fgCircle.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
  svg.appendChild(fgCircle);

  return svg;
}

export function scrollToTop(isSmooth = true): void {
  if (isSmooth) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo(0, 0);
  }
}


const sideMenuContent = document.getElementById('sideMenuContent');

export function showSideMenuContent() {
  sideMenuContent?.classList.remove('translate-x-full');
  sideMenuContent?.classList.add('translate-x-0');
}

export function hideSideMenuContent() {
  sideMenuContent?.classList.add('translate-x-full');
  sideMenuContent?.classList.remove('translate-x-0');
}
