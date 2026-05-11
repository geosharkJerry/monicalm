/**
 * BFF / new-api shared data contracts.
 * These mirror the JSON shapes exposed by the Go backend under `/api/*`.
 */

export interface ApiToken {
  id: number;
  /** Display name the user assigned. */
  name: string;
  /** Full key — only returned at create time, masked everywhere else. */
  key: string;
  /** Per-token quota cap in atomic credits ("$1 = 500_000"). 0 = unlimited. */
  remain_quota: number;
  used_quota: number;
  unlimited_quota: boolean;
  status: 1 | 2 | 3; // 1 = enabled, 2 = disabled, 3 = expired
  expired_time: number; // unix sec, -1 = never
  created_time: number;
  /** Optional model whitelist. */
  models?: string[];
}

export interface QuotaSummary {
  /** Remaining quota in atomic units. */
  remain_quota: number;
  /** Total quota ever granted. */
  total_quota: number;
  /** Used quota over the selected window. */
  used_quota: number;
  /** Currency multiplier used to render USD. */
  quota_per_unit: number;
}

export interface UsagePoint {
  /** YYYY-MM-DD or epoch-ms. */
  ts: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number; // in atomic units
}

export interface ModelShare {
  model: string;
  tokens: number;
  cost: number;
}

export interface PricingEntry {
  model: string;
  /** Friendly provider tag. */
  provider: string;
  /** Cost multipliers vs base unit. */
  input_rate: number;
  output_rate: number;
  /** Optional context window in K. */
  context?: number;
  /** Optional capability tags. */
  tags?: string[];
}

export interface RedeemResult {
  success: boolean;
  message: string;
  /** Amount of quota credited (atomic units). */
  granted_quota?: number;
}

/* -------- Admin -------- */

export interface AdminUser {
  id: number;
  username: string;
  display_name: string;
  email: string;
  role: 1 | 10 | 100; // 1=user, 10=admin, 100=root
  status: 1 | 2; // 1=ok, 2=banned
  quota: number;
  used_quota: number;
  created_time: number;
}

export interface Channel {
  id: number;
  name: string;
  type: number;             // provider type id from new-api
  base_url: string;
  /** Key never returned in cleartext in list views. */
  key?: string;
  models: string[];
  /** Weight & concurrency. */
  weight: number;
  rate_limit?: number;
  /** 1=on 2=off 3=auto-disabled */
  status: 1 | 2 | 3;
  test_time?: number;
  response_time?: number;
}

export interface RedeemCodeBatch {
  prefix?: string;
  quota: number;
  count: number;
  expires_at?: number;
}

export interface LogEntry {
  id: number;
  created_at: number;
  user_id: number;
  channel_id: number;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  status_code: number;
  duration_ms: number;
  /** Atomic cost. */
  quota: number;
}
