import { expect, it, vi } from 'vitest'
import type { Session } from './sessions'

const instances: FakeChart[] = []
class FakeChart {
  viewport = { from: 100, to: 200 }
  renderer = { getConfig: () => ({}), applyConfig: () => {} }
  drawings = { toJSON: () => ({ version: 1 as const, drawings: [] }), fromJSON: () => {} }
  constructor() { instances.push(this) }
  ready() { return Promise.resolve() }
  indicators() { return [] }
  addNativeIndicator() { return { setVisible: () => {} } }
  on() { return () => {} }
  getVisibleRange() { return { ...this.viewport } }
  setVisibleRange(range: { from: number; to: number }) { this.viewport = range }
  async setMarket(opts: { visibleRange?: { from: number; to: number } }) { this.viewport = opts.visibleRange ?? { from: 900, to: 1000 } }
  destroy() {}
}
vi.mock('@luxalgo/vela', () => ({ Vela: class { constructor() { return new FakeChart() } } }))
const { ChartBridge } = await import('./chartBridge')
const selection = { symbol: 'BTCUSDT' as const, timeframe: '5m' as const, asOf: 1673136000000 }
const bars = [{ time: selection.asOf-300000, open: 100, high: 102, low: 99, close: 101, volume: 2 }]

it('restores saved viewport before an initial update captures it', async () => {
  const restored: Session = { schemaVersion:1, selection, speed:1, datasetVersion:'a'.repeat(64), drawingsCreatedAt:{}, chartsBySymbol:{ BTCUSDT:{drawings:{version:1,drawings:[]},indicators:[],viewport:{from:10,to:20}} } }
  const bridge = new ChartBridge({} as HTMLElement, selection, bars, () => {}, restored)
  await bridge.update(selection, bars)
  expect(bridge.snapshot().chartsBySymbol.BTCUSDT?.viewport).toEqual({from:10,to:20})
})

it('keeps a panned viewport on a replay step', async () => {
  const bridge = new ChartBridge({} as HTMLElement, selection, bars, () => {})
  await bridge.update(selection, bars)
  instances.at(-1)!.viewport = {from:50,to:70}
  await bridge.update({...selection,asOf:selection.asOf+300000},bars)
  expect(instances.at(-1)!.viewport).toEqual({from:50,to:70})
})
