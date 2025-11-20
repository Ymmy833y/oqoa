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
