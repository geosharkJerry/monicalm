/**
 * Redeem code utilities — shared between admin batch-generator and the
 * /api/redeem BFF endpoint.
 *
 * Code format:  <PREFIX>-XXXX-XXXX-XXXX  (Crockford Base32, no I/L/O/U)
 * The 12 random characters give ~60 bits of entropy, sufficient for
 * one-off promo codes.
 */

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomCode(prefix = 'MONICA'): string {
  const buf = new Uint8Array(12);
  // Works in both browsers and Edge / Node 18+ runtimes
  (globalThis.crypto ?? require('crypto').webcrypto).getRandomValues(buf);
  const body = Array.from(buf, (b) => ALPHABET[b % ALPHABET.length])
    .join('')
    .match(/.{1,4}/g)!
    .join('-');
  return `${prefix}-${body}`;
}

export interface GeneratedCode {
  code: string;
  quota: number;
  expires_at?: number;
}

export interface GenerateOpts {
  count: number;
  quota: number;
  prefix?: string;
  expires_at?: number;
}

export function generateRedeemCodes(opts: GenerateOpts): GeneratedCode[] {
  const { count, quota, prefix = 'MONICA', expires_at } = opts;
  if (count <= 0 || count > 10_000) {
    throw new Error('count must be between 1 and 10000');
  }
  if (quota <= 0) throw new Error('quota must be positive');

  const seen = new Set<string>();
  const out: GeneratedCode[] = [];
  while (out.length < count) {
    const code = randomCode(prefix);
    if (seen.has(code)) continue; // avoid collisions
    seen.add(code);
    out.push({ code, quota, expires_at });
  }
  return out;
}

/** CSV serializer — RFC 4180-safe quoting for code/quota/expires_at. */
export function toCSV(rows: GeneratedCode[]): string {
  const header = 'code,quota,expires_at';
  const body = rows
    .map(
      (r) =>
        `${csvEscape(r.code)},${r.quota},${
          r.expires_at ? new Date(r.expires_at * 1000).toISOString() : ''
        }`,
    )
    .join('\n');
  return header + '\n' + body + '\n';
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Trigger a client-side download of the CSV. */
export function downloadCSV(rows: GeneratedCode[], filename = 'redeem-codes.csv') {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
