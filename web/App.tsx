import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChartIcon, CheckIcon, DownloadIcon, PauseIcon, Pencil1Icon, PlayIcon, ReloadIcon, ResetIcon, TrackNextIcon } from '@radix-ui/react-icons'
import { api, loadBars, type BarResponse, type Markets } from './api'
import { Chart } from './Chart'
import type { ChartBridge } from './chartBridge'
import { DataPanel } from './DataPanel'
import { Dialog } from './Dialog'
import { DrawingTools } from './DrawingTools'
import { Indicators } from './Indicators'
import { LatestRequest, MINUTES, SerialWriter, TIMEFRAMES, canKeepPaintedFrame, nextBoundary, type Selection, type Symbol } from './replay'
import { downloadSession, type Session } from './sessions'

const initial: Selection = { symbol: 'BTCUSDT', timeframe: '5m', asOf: Date.UTC(2023, 0, 8) }
const formatUTC = (time: number) => new Date(time).toISOString().slice(0, 16).replace('T', ' ')
const datetimeValue = (time: number) => new Date(time).toISOString().slice(0, 16)
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

export default function App() {
  const [markets, setMarkets] = useState<Markets | null>(null)
  const [selection, setSelection] = useState<Selection>(initial)
  const [version, setVersion] = useState('')
  const [restored, setRestored] = useState<Session | null>(null)
  const [data, setData] = useState<(BarResponse & { selection: Selection }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [dialog, setDialog] = useState<'data' | 'indicators' | 'drawings' | null>(null)
  const [revision, setRevision] = useState(0)
  const [saveState, setSaveState] = useState('')
  const bridge = useRef<ChartBridge | null>(null)
  const latest = useRef(new LatestRequest<BarResponse>())
  const saveRevision = useRef(0)
  const writer = useRef(new SerialWriter<Session>(async payload => {
    await api('/session', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  }))
  const [bridgeReady, setBridgeReady] = useState(false)
  const [paintedKey, setPaintedKey] = useState('')
  const onPainted = useCallback((key: string) => setPaintedKey(key), [])
  const onReady = useCallback((instance: ChartBridge) => { bridge.current = instance; setBridgeReady(true) }, [])
  const onChange = useCallback(() => setRevision(v => v+1), [])
  const renderKey = `${selection.symbol}:${selection.timeframe}:${selection.asOf}:${version}`
  const pending = loading || paintedKey !== renderKey
  const conceal = !!error || !canKeepPaintedFrame(paintedKey, selection, version)

  useEffect(() => {
    let live = true
    void Promise.all([api<Markets>('/markets'), api<Session | null>('/session')]).then(([available, saved]) => {
      if (!live) return
      setMarkets(available)
      if (saved) { setRestored(saved); setSelection(saved.selection); setSpeed(saved.speed); setVersion(saved.datasetVersion) }
      else {
        const first = available.markets.find(m => m.symbol === 'BTCUSDT')?.ranges[0]
        if (first) setSelection({ ...initial, asOf: Math.min(first.start+7*86400000, first.end) })
        setVersion(available.datasetVersion)
      }
    }).catch(e => { if (live) { setError(e.message); setLoading(false) } })
    return () => { live = false; latest.current.cancel() }
  }, [])

  useEffect(() => {
    if (!version || !markets) return
    setLoading(true); setError('')
    void latest.current.run(signal => loadBars(selection, version, signal)).then(response => {
      if (!response) return
      if (!response.bars.length) throw new Error('Pro tento timeframe ještě není dokončená ani jedna minuta v jeho prvním bucketu. Zvolte pozdější začátek.')
      setData({ ...response, selection }); setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false); setPlaying(false) })
  }, [selection, version, markets])

  const step = useCallback(() => {
    if (!data || pending || error) return
    const next = Math.min(nextBoundary(selection.asOf, selection.timeframe), data.available.end)
    if (next <= selection.asOf) { setPlaying(false); return }
    setSelection(current => ({ ...current, asOf: next }))
  }, [data, pending, error, selection])

  useEffect(() => {
    if (!playing || pending) return
    if (error || (data && selection.asOf >= data.available.end)) { setPlaying(false); return }
    const timer = setTimeout(step, 1000/speed)
    return () => clearTimeout(timer)
  }, [playing, pending, speed, step, error, data, selection.asOf])

  const snapshot = useCallback((): Session | null => {
    if (!bridge.current || !data || pending || error) return null
    return { schemaVersion: 1, selection, speed, datasetVersion: data.datasetVersion, ...bridge.current.snapshot() }
  }, [data, selection, speed, pending, error])

  const save = useCallback(async () => {
    const payload = snapshot()
    if (!payload) return
    const revision = ++saveRevision.current
    try {
      setSaveState('Ukládám…')
      await writer.current.write(payload)
      if (revision === saveRevision.current) setSaveState('Uloženo lokálně')
    } catch (e) { if (revision === saveRevision.current) setSaveState(e instanceof Error ? `Uložení selhalo: ${e.message}` : 'Uložení selhalo') }
  }, [snapshot])

  useEffect(() => {
    if (!bridgeReady || loading || error) return
    const timer = setTimeout(() => { void save() }, 900)
    return () => clearTimeout(timer)
  }, [revision, bridgeReady, save, loading, error])

  const refresh = useCallback(() => {
    void api<Markets>('/markets').then(available => { setMarkets(available); setVersion(available.datasetVersion); setPlaying(false) }).catch(e => setError(e.message))
  }, [])

  const seek = (time: number) => {
    if (!Number.isFinite(time)) return
    setPlaying(false)
    setSelection(s => ({ ...s, asOf: Math.floor(time/60_000)*60_000 }))
  }

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (dialog || target.closest('input, textarea, select, button, [contenteditable]')) return
      if (event.code === 'Space') { event.preventDefault(); if (playing || (!pending && !error)) setPlaying(p => !p) }
      if (event.code === 'ArrowRight' && event.altKey) { event.preventDefault(); step() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [dialog, pending, playing, error, step])

  // Hide the prior frame synchronously on selection changes and until Vela has
  // accepted the new prefix. A backwards seek must not flash future candles.
  const last = !pending && !error ? data?.bars.at(-1) : undefined
  const change = last ? (last.close-last.open)/last.open*100 : 0
  const currentMarket = markets?.markets.find(m => m.symbol === selection.symbol)
  const available = data?.selection.symbol === selection.symbol ? data.available : currentMarket?.ranges[0]
  const reachedEnd = !!data && selection.asOf >= data.available.end

  return <div className="app">
    <a className="skip-link" href="#chart-area">Přejít na graf</a>
    <header className="app-header">
      <h1 className="brand"><span className="brand-mark"><BarChartIcon /></span>PERP<span className="brand-divider">/</span><span>REPLAY</span></h1>
      <nav aria-label="Části aplikace"><span className="nav-current">Replay</span><span className="nav-future">Journal <small>později</small></span><span className="nav-future">Quant <small>později</small></span></nav>
      <div className="header-actions"><span className="local-badge"><span />Historická data · lokálně</span><button className="quiet" onClick={() => { setPlaying(false); setDialog('data') }}><DownloadIcon />Správa dat</button></div>
    </header>
    <main id="chart-area" className="workspace">
      <div className="chart-header">
        <div className="market-group"><label className="sr-only" htmlFor="market">Pár</label><select id="market" value={selection.symbol} onChange={e => { setPlaying(false); setSelection(s => ({ ...s, symbol: e.target.value as Symbol })) }}><option value="BTCUSDT">BTC / USDT</option><option value="ETHUSDT">ETH / USDT</option><option value="SOLUSDT">SOL / USDT</option></select><span className="venue">BINANCE USD-M <span>PERP</span></span></div>
        <div className="timeframes" role="group" aria-label="Timeframe">{TIMEFRAMES.map(tf => <button key={tf} aria-pressed={selection.timeframe === tf} onClick={() => { setPlaying(false); setSelection(s => ({ ...s, timeframe: tf })) }}>{tf}</button>)}</div>
        <div className="chart-actions"><button className="quiet" onClick={() => { setPlaying(false); setDialog('drawings') }} disabled={!bridgeReady}><Pencil1Icon />Kreslení</button><button className="quiet" onClick={() => { setPlaying(false); setDialog('indicators') }} disabled={!bridgeReady}><BarChartIcon />Indikátory</button><button className="icon-button" aria-label="Obnovit rozsah grafu" title="Obnovit rozsah grafu" onClick={() => {
          if (data?.bars.length && bridge.current) bridge.current.chart.setVisibleRange({ from: data.bars[Math.max(0, data.bars.length-160)].time, to: data.bars.at(-1)!.time+MINUTES[selection.timeframe]*60_000*10 })
        }}><ResetIcon /></button></div>
      </div>
      <div className="price-strip" aria-label="Poslední odhalená svíčka"><strong>{last ? number(last.close) : '—'}</strong><span className={change >= 0 ? 'positive' : 'negative'}>{last ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}</span><div className="ohlc">{(['open', 'high', 'low', 'close'] as const).map((key,i) => <span key={key}><small>{['O','H','L','C'][i]}</small>{last ? number(last[key]) : '—'}</span>)}</div><span className="partial-hint">{selection.timeframe === '1m' ? 'Dokončené minutové svíčky' : 'Rozehraná svíčka bez budoucích dat'}</span></div>
      <section className="chart-container" aria-label="Graf replaye" aria-busy={pending}>
        <div className={`chart-wrapper ${conceal ? 'concealed' : ''}`}>{data ? <Chart selection={data.selection} bars={data.bars} restored={restored} onReady={onReady} onChange={onChange} onPainted={onPainted} renderKey={`${data.selection.symbol}:${data.selection.timeframe}:${data.selection.asOf}:${data.datasetVersion}`} /> : null}</div>
        {error ? <div className="chart-message"><h2>Graf čeká na data</h2><p role="alert">{error}</p><div><button className="primary" onClick={() => setDialog('data')}>Otevřít správu dat</button><button onClick={refresh}><ReloadIcon />Zkusit znovu</button></div></div> : pending && conceal ? <div className="chart-message loading"><div className="loading-bars"><i /><i /><i /><i /><i /></div><p>Načítám historické svíčky…</p></div> : pending ? <div className="chart-loading-note">Načítám další svíčky…</div> : null}
      </section>
      <div className="replay-controls">
        <div className="replay-label"><span className="replay-dot" />BAR REPLAY<span className="play-state">{playing ? 'Přehrávání' : reachedEnd ? 'Konec historie' : 'Pozastaveno'}</span></div>
        <div className="transport"><button className="play-button" aria-label={playing ? 'Pozastavit replay' : 'Přehrát replay'} title="Mezerník" disabled={!playing && (pending || !!error || reachedEnd)} onClick={() => setPlaying(p => !p)}>{playing ? <PauseIcon /> : <PlayIcon />}</button><button className="icon-button" aria-label="Další svíčka" title="Alt + →" disabled={pending || !!error || reachedEnd} onClick={step}><TrackNextIcon /></button><label className="sr-only" htmlFor="speed">Rychlost replaye</label><select id="speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[0.25, 0.5, 1, 2, 5, 10, 20].map(v => <option key={v} value={v}>{v}×</option>)}</select></div>
        <form className="date-form" onSubmit={event => {
          event.preventDefault()
          const value = new FormData(event.currentTarget).get('replayTime')
          if (typeof value === 'string' && value) seek(Date.parse(value+'Z'))
        }}><label className="replay-date">Čas replaye · UTC<input key={selection.asOf} name="replayTime" type="datetime-local" defaultValue={datetimeValue(selection.asOf)} min={available ? datetimeValue(available.start+60000) : '2023-01-01T00:01'} max={available ? datetimeValue(available.end) : undefined} required /></label><button className="quiet" type="submit">Přejít</button></form>
        <div className="save-actions"><span className="save-status" role="status">{saveState === 'Uloženo lokálně' ? <CheckIcon /> : null}{saveState}</span><button className="quiet" disabled={!bridgeReady || pending || !!error} onClick={() => void save()}>Uložit session</button><button className="icon-button" aria-label="Exportovat session" title="Exportovat session do JSON" disabled={!bridgeReady || pending || !!error} onClick={() => { const s = snapshot(); if (s) downloadSession(s) }}><DownloadIcon /></button></div>
      </div>
      <div className="timeline"><span>{available ? formatUTC(available.start) : '2023'}</span><label className="sr-only" htmlFor="timeline">Posunout čas replaye</label><input id="timeline" type="range" min={available ? available.start+60000 : initial.asOf} max={available?.end ?? initial.asOf+60000} step={60000} value={selection.asOf} disabled={!available} onChange={e => seek(Number(e.target.value))} /><span>{available ? formatUTC(available.end) : '—'}</span></div>
      <footer className="status-bar"><span>{selection.symbol} · {selection.timeframe} · UTC</span><span>{loading ? 'Načítání' : error ? 'Data nejsou dostupná' : `${data?.bars.length.toLocaleString('cs-CZ')} svíček · odhaleno do ${formatUTC(selection.asOf)} UTC`}</span><a href="https://velacharts.dev" target="_blank" rel="noreferrer">Charting by Vela</a></footer>
    </main>
    {dialog ? <Dialog title={dialog === 'data' ? 'Historická data' : dialog === 'drawings' ? 'Kreslení' : 'Indikátory'} onClose={() => setDialog(null)}>{dialog === 'data' ? <DataPanel markets={markets} onRefresh={refresh} /> : dialog === 'drawings' ? <DrawingTools bridge={bridge.current} onChoose={() => setDialog(null)} /> : <Indicators bridge={bridge.current} />}</Dialog> : null}
  </div>
}
