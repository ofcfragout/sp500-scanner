export interface OHLCV {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ScoreBreakdown {
  ticker: string;
  trend: number;
  momentum: number;
  volume: number;
  structure: number;
  fib: number;
  weekly: number;
  composite: number;
  summary: string;
  details: Record<string, unknown>;
}

export interface StockSetupRow {
  id?: string;
  ticker: string;
  composite_score: number;
  trend_score: number;
  momentum_score: number;
  volume_score: number;
  structure_score: number;
  fib_score: number;
  weekly_score: number;
  summary: string | null;
  details: Record<string, unknown>;
  updated_at?: string;
}
