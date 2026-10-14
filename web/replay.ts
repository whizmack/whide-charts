export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h'] as const
export type Timeframe = typeof TIMEFRAMES[number]
export type Symbol = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT'
export type Selection = { symbol: Symbol; timeframe: Timeframe; asOf: number }
export const MINUTES: Record<Timeframe, number> = { '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240 }

export function nextBoundary(asOf: number, timeframe: Timeframe): number {
  const width = MINUTES[timeframe] * 60_000
  return (Math.floor(asOf / width) + 1) * width
}

export function canKeepPaintedFrame(key: string, selection: Selection, version: string) {
  const [symbol, , asOf, paintedVersion] = key.split(':')
  return symbol === selection.symbol && paintedVersion === version && Number(asOf) <= selection.asOf
}

export class LatestRequest<T> {
  private generation = 0
  private abort?: AbortController
  async run(task: (signal: AbortSignal) => Promise<T>): Promise<T | undefined> {
    this.abort?.abort()
    const request = ++this.generation
    this.abort = new AbortController()
    try {
      const data = await task(this.abort.signal)
      return request === this.generation ? data : undefined
    } catch (error) {
      if (request !== this.generation || (error instanceof DOMException && error.name === 'AbortError')) return undefined
      throw error
    }
  }
  cancel() { this.generation++; this.abort?.abort() }
}

/** One in-flight write, with invocation order retained even after a failure. */
export class SerialWriter<T> {
  private tail: Promise<void> = Promise.resolve()
  constructor(private send: (value: T) => Promise<void>) {}
  write(value: T): Promise<void> {
    const next = this.tail.then(() => this.send(value))
    this.tail = next.catch(() => {})
    return next
  }
}
