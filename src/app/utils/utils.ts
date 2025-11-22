export function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function shuffled<T>(array: T[]): T[] {
  const copy = [...array];
  shuffle(copy);
  return copy;
}

export function isSameNumbers(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;

  const countMap = new Map<number, number>();

  for (const id of a) {
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  for (const id of b) {
    const current = countMap.get(id);
    if (current == null || current === 0) {
      return false;
    }
    countMap.set(id, current - 1);
  }

  return true;
}

export function formatToYMDHMS(iso: string | Date): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const MM   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const HH   = String(d.getHours()).padStart(2, '0');
  const mm   = String(d.getMinutes()).padStart(2, '0');
  const ss   = String(d.getSeconds()).padStart(2, '0');

  return `${yyyy}/${MM}/${dd} ${HH}:${mm}:${ss}`;
}
