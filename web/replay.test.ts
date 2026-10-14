import { describe, expect, it } from 'vitest'
import { LatestRequest, SerialWriter, canKeepPaintedFrame, nextBoundary } from './replay'

describe('replay clock', () => {
  it.each([['1m', 26], ['5m', 30], ['15m', 30], ['1h', 60], ['4h', 240]] as const)('steps %s to its next UTC boundary', (tf, minute) => {
    expect(nextBoundary(Date.UTC(2023, 0, 1, 0, 25), tf)).toBe(Date.UTC(2023, 0, 1, 0, minute))
  })
  it('advances on an exact boundary', () => {
    expect(nextBoundary(Date.UTC(2023, 0, 1, 4), '4h')).toBe(Date.UTC(2023, 0, 1, 8))
  })
  it('ignores an older response even if its source ignores abort', async () => {
    const loader = new LatestRequest<number>()
    let finish!: (value: number) => void
    const old = loader.run(() => new Promise<number>(resolve => { finish = resolve }))
    expect(await loader.run(async () => 2)).toBe(2)
    finish(1)
    expect(await old).toBeUndefined()
  })
  it('cancel prevents a late update', async () => {
    const loader = new LatestRequest<number>()
    const old = loader.run(async () => 1)
    loader.cancel()
    expect(await old).toBeUndefined()
  })
})

it('serializes session writes so an old request cannot overwrite the latest', async () => {
  let finish!: () => void
  const started: number[] = []
  const writer = new SerialWriter<number>(async n => { started.push(n); if (n === 1) await new Promise<void>(resolve => { finish = resolve }) })
  const first = writer.write(1)
  const second = writer.write(2)
  await Promise.resolve()
  expect(started).toEqual([1])
  finish()
  await Promise.all([first, second])
  expect(started).toEqual([1, 2])
})

it('a failed save does not prevent the next snapshot from being saved', async () => {
  const writer = new SerialWriter<number>(async n => { if (n === 1) throw new Error('disk error') })
  await expect(writer.write(1)).rejects.toThrow('disk error')
  await expect(writer.write(2)).resolves.toBeUndefined()
})

it('can keep a past frame while loading forward but conceals it immediately on rewind or market/version change', () => {
  const selection = { symbol:'BTCUSDT' as const, timeframe:'5m' as const, asOf:2000 }
  expect(canKeepPaintedFrame('BTCUSDT:5m:1000:one', selection, 'one')).toBe(true)
  expect(canKeepPaintedFrame('BTCUSDT:5m:3000:one', selection, 'one')).toBe(false)
  expect(canKeepPaintedFrame('ETHUSDT:5m:1000:one', selection, 'one')).toBe(false)
  expect(canKeepPaintedFrame('BTCUSDT:5m:1000:old', selection, 'one')).toBe(false)
})
