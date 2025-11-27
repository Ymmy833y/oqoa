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

export function formatToYYMMDDHHMM(iso: string | Date): string {
  const d = new Date(iso);
  const yy   = String(d.getFullYear()).slice(-2);
  const MM   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const HH   = String(d.getHours()).padStart(2, '0');
  const mm   = String(d.getMinutes()).padStart(2, '0');

  return `${yy}/${MM}/${dd} ${HH}:${mm}`;
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

export function formatToYDHM(iso: string | Date): string {
  const d = new Date(iso);
  const MM   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const HH   = String(d.getHours()).padStart(2, '0');
  const mm   = String(d.getMinutes()).padStart(2, '0');

  return `${MM}/${dd} ${HH}:${mm}`;
}

export function loadScript(url: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error: ${url}`));
    document.head.appendChild(script);
  });
}

export function convertToFileFromCsvText(csvText: string, filename = 'downloaded.csv') {
  const blob = new Blob([csvText], { type: 'text/csv' });
  return new File([blob], filename, { type: 'text/csv' });
}

export function removeTagContent(input: string): string {
  return input.replace(/<.*?>/g, '');
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Clipboard copy failed:', err);
  }
};
