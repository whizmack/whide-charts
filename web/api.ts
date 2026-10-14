import type { Selection, Symbol } from './replay'

export type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number }
export type Market = { symbol: Symbol; ranges: { start: number; end: number }[]; rows: number }
export type Markets = { markets: Market[]; datasetVersion: string }
export type BarResponse = { bars: Bar[]; asOf: number; datasetVersion: string; available: { start: number; end: number } }
export type ImportJob = { id: string; status: 'running' | 'complete' | 'partial' | 'failed'; done: number; total: number; current: string; errors: { symbol?: string; period?: string; message: string }[] }

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, init)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const detail = error.detail
    throw new Error(typeof detail === 'string' ? detail : `Request failed (${response.status}). Check the entered values.`)
  }
  return response.json() as Promise<T>
}

export function loadBars(selection: Selection, version: string, signal: AbortSignal) {
  return api<BarResponse>(`/bars?${new URLSearchParams({ symbol: selection.symbol, timeframe: selection.timeframe, asOf: String(selection.asOf), version, limit: '1000' })}`, { signal })
}
