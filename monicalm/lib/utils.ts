import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Genspark-style className concat. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact number formatter for token counts. */
export function formatTokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 2 : 1) + 'K';
  return (n / 1_000_000).toFixed(2) + 'M';
}

/** Mask an API key into Genspark-style `sk-****abcd`. */
export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return key.slice(0, 3) + '****';
  return key.slice(0, 3) + '****' + key.slice(-4);
}

/** Simple debounce. */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms = 250) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
