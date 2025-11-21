interface ElOptions {
  id?: string;
  class?: string;
  text?: string;
  attr?: Record<string, string>[];
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions,
): HTMLElementTagNameMap[K];

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  arg2?: string | ElOptions,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof arg2 === 'string' || arg2 === undefined) {
    const className = arg2;

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;

    return node;
  }

  const options = arg2;
  const { id: optId, text: optText, attr } = options;
  const optClass = options.class;

  if (optId) node.id = optId;
  if (optClass) node.className = optClass;
  if (optText !== undefined) node.textContent = optText;

  if (attr) {
    for (const attrs of attr) {
      for (const [key, value] of Object.entries(attrs)) {
        node.setAttribute(key, value);
      }
    }
  }

  return node;
}

export function scrollToTop(isSmooth = true): void {
  if (isSmooth) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo(0, 0);
  }
}
