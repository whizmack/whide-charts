import { Vela, type DrawingsDocument, type IndicatorHandle } from '@luxalgo/vela'
import type { Bar } from './api'
import { MINUTES, type Selection, type Symbol } from './replay'
import { visibleDrawing, type ChartSnapshot, type Session } from './sessions'

const VELA_TF = { '1m': '1', '5m': '5', '15m': '15', '1h': '60', '4h': '240' } as const
export const INDICATORS = [
  { type: 'volume', label: 'Volume' }, { type: 'sma', label: 'SMA' },
  { type: 'ema', label: 'EMA' }, { type: 'rsi', label: 'RSI' },
  { type: 'macd', label: 'MACD' }, { type: 'bollinger-bands', label: 'Bollinger Bands' },
]

/** Explicit candle input only. The mode owner supplies replay prefixes or an isolated live window. */
export class ChartBridge {
  readonly chart: Vela
  private selection: Selection
  private snapshots: Partial<Record<Symbol, ChartSnapshot>> = {}
  private createdAt: Record<string, number> = {}
  private document: DrawingsDocument = { version: 1, drawings: [] }
  private applying = false
  private isReady = false
  private destroyed = false
  private generation = 0
  private readonly ready: Promise<void>
  private off: (() => void)[] = []

  constructor(host: HTMLElement, selection: Selection, bars: Bar[], private onChange: () => void, restored?: Session | null, private mode:'replay'|'live'='replay') {
    this.selection = selection
    if (restored) {
      this.snapshots = restored.chartsBySymbol
      this.createdAt = restored.drawingsCreatedAt
    }
    this.chart = new Vela(host, {
      symbol: selection.symbol+'.P', timeframe: VELA_TF[selection.timeframe],
      data: bars, bars: bars.length, live: false, theme: 'dark',
      animations: { intro: false }, upColor: '#36b89a', downColor: '#ed6873',
      drawings: { tools: ['trendline', 'hline', 'box', 'fibretracement', 'text', 'position', 'datepricerange'] },
    })
    this.restoreSymbol(selection.symbol)
    this.off.push(this.chart.renderer.onConfigChanged(() => {
      if (this.applying) return
      this.capture()
      this.onChange()
    }))
    for (const event of ['drawing:created', 'drawing:edited', 'drawing:removed', 'indicator:added', 'indicator:removed', 'indicator:inputs', 'indicator:visibility', 'viewport:changed'] as const) {
      this.off.push(this.chart.on(event, () => {
        if (this.applying) return
        this.capture()
        this.onChange()
      }))
    }
    this.ready = this.chart.ready().then(() => {
      if (this.destroyed) return
      this.frameInitial(bars)
      this.isReady = true
      this.onChange()
    })
  }

  private capture() {
    if (!this.isReady) return
    const raw = this.chart.drawings.toJSON()
    this.document = {
      version: 1,
      drawings: raw.drawings.map(d => {
        const key = `${this.selection.symbol}:${d.id}`
        this.createdAt[key] ??= this.selection.asOf
        const prior = this.document.drawings.find(x => x.id === d.id)
        return this.createdAt[key] > this.selection.asOf && prior ? { ...d, visible: prior.visible } : d
      }),
    }
    this.snapshots[this.selection.symbol] = {
      drawings: this.document,
      indicators: this.chart.indicators().filter(h => h.nativeType).map(h => ({ type: h.nativeType!, inputs: h.inputValues(), visible: h.visible })),
      viewport: this.chart.getVisibleRange(), renderer: this.chart.renderer.getConfig(),
    }
  }

  private projectDrawings() {
    this.chart.drawings.fromJSON({ version: 1, drawings: this.document.drawings.map(d => ({
      ...d, visible: this.mode==='live' ? d.visible : visibleDrawing(d.visible, this.createdAt[`${this.selection.symbol}:${d.id}`], this.selection.asOf),
    })) })
  }

  private restoreSymbol(symbol: Symbol) {
    const saved = this.snapshots[symbol]
    this.applying = true
    for (const handle of this.chart.indicators()) handle.remove()
    if (saved) {
      this.document = saved.drawings
      if (saved.renderer) this.chart.renderer.applyConfig(saved.renderer)
      for (const ind of saved.indicators) {
        const handle = this.chart.addNativeIndicator(ind.type, { inputs: ind.inputs })
        if (!ind.visible) handle.setVisible(false)
      }
    } else {
      this.document = { version: 1, drawings: [] }
      this.chart.addNativeIndicator('volume')
      this.chart.addNativeIndicator('ema', { inputs: { length: 20 } })
    }
    this.projectDrawings()
    this.applying = false
  }

  private frameInitial(bars: Bar[]) {
    const saved = this.snapshots[this.selection.symbol]?.viewport
    const width = MINUTES[this.selection.timeframe]*60_000
    if (saved) this.chart.setVisibleRange(saved)
    else if (bars.length) this.chart.setVisibleRange({ from: bars[Math.max(0, bars.length-160)].time, to: bars.at(-1)!.time+width*10 })
  }

  async update(selection: Selection, bars: Bar[]) {
    const generation = ++this.generation
    await this.ready
    if (this.destroyed || generation !== this.generation) return
    this.capture()
    const changed = selection.symbol !== this.selection.symbol
    const old = this.selection
    let viewport = changed ? this.snapshots[selection.symbol]?.viewport : this.chart.getVisibleRange()
    if (!changed && viewport && old.asOf !== selection.asOf) {
      const width = MINUTES[old.timeframe]*60_000
      const delta = selection.asOf-old.asOf
      // Follow the edge while replaying; a deliberate pan remains anchored.
      if (viewport.to >= old.asOf-width*2 || Math.abs(delta) > width) {
        viewport = { from: viewport.from+delta, to: viewport.to+delta }
      }
    }
    this.selection = selection
    this.applying = true
    await this.chart.setMarket({ symbol: selection.symbol+'.P', timeframe: VELA_TF[selection.timeframe], data: bars, bars: bars.length, ...(viewport ? { visibleRange: viewport } : {}) })
    if (this.destroyed || generation !== this.generation) return
    if (changed) { this.restoreSymbol(selection.symbol); this.frameInitial(bars) }
    else this.projectDrawings()
    this.applying = false
  }

  snapshot() { this.capture(); return { chartsBySymbol: structuredClone(this.snapshots), drawingsCreatedAt: { ...this.createdAt } } }
  indicators(): IndicatorHandle[] { return this.chart.indicators() }
  addIndicator(type: string) { this.chart.addNativeIndicator(type); this.capture(); this.onChange() }
  resetView() { this.chart.renderer.set('resetView', true) }
  destroy() { this.destroyed = true; this.generation++; for (const off of this.off) off(); this.chart.destroy() }
}
