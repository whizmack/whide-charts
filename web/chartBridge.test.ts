import { expect, it, vi } from 'vitest'
import type { DrawingsDocument } from '@luxalgo/vela'
import type { Session } from './sessions'

const instances: FakeChart[] = []
class FakeChart {
  viewport = { from: 100, to: 200 }
  config: unknown = {}
  configChanged = () => {}
  renderer = {
    getConfig: () => this.config,
    applyConfig: (config: unknown) => { this.config = config },
    onConfigChanged: (cb: () => void) => { this.configChanged = cb; return () => {} },
  }
  loadedDocument = {version:1,drawings:[] as {id:string;visible:boolean}[]}
  drawings = { toJSON: () => this.loadedDocument, fromJSON: (document:typeof this.loadedDocument) => { this.loadedDocument=document } }
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

it('autosaves cosmetic chart settings without requiring a pan or drawing edit', async () => {
  const changed = vi.fn()
  const bridge = new ChartBridge({} as HTMLElement, selection, bars, changed)
  await bridge.update(selection, bars)
  changed.mockClear()
  const chart = instances.at(-1)!
  chart.config = { canvas: { background: '#0f0f0f' }, grid: { visible: false } }
  chart.configChanged()
  expect(changed).toHaveBeenCalledOnce()
  expect(bridge.snapshot().chartsBySymbol.BTCUSDT?.renderer).toEqual(chart.config)
})

it('keeps live drawings visible when a different timeframe bucket starts earlier', async () => {
  const restored:Session={schemaVersion:1,selection,speed:1,datasetVersion:'live',drawingsCreatedAt:{'BTCUSDT:line':selection.asOf+1000},chartsBySymbol:{BTCUSDT:{drawings:{version:1,drawings:[{id:'line',visible:true}] as DrawingsDocument['drawings']},indicators:[],viewport:null}}}
  const bridge=new ChartBridge({} as HTMLElement,selection,bars,()=>{},restored,'live')
  await bridge.update(selection,bars)
  expect(instances.at(-1)!.loadedDocument.drawings[0].visible).toBe(true)
})
