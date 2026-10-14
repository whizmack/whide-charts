import { useCallback, useEffect, useRef, useState } from 'react'
import { BarChartIcon, CalendarIcon, CheckIcon, DownloadIcon, EnterFullScreenIcon, GearIcon, PauseIcon, Pencil1Icon, PlayIcon, ReloadIcon, ResetIcon, TrackNextIcon } from '@radix-ui/react-icons'
import { api, loadBars, type BarResponse, type Markets } from './api'
import { Chart } from './Chart'
import type { ChartBridge } from './chartBridge'
import { DataPanel } from './DataPanel'
import { Dialog } from './Dialog'
import { DrawingTools } from './DrawingTools'
import { Indicators } from './Indicators'
import { LatestRequest, MINUTES, SerialWriter, TIMEFRAMES, canKeepPaintedFrame, nextBoundary, type Selection, type Symbol } from './replay'
import { downloadSession, seedLiveSession, restoreWithAppearance, type Session } from './sessions'
import { LiveFeed, type LiveState } from './live'

const initial: Selection = { symbol: 'BTCUSDT', timeframe: '5m', asOf: Date.UTC(2023, 0, 8) }
const formatUTC = (time: number) => new Date(time).toISOString().slice(0, 16).replace('T', ' ')
const datetimeValue = (time: number) => new Date(time).toISOString().slice(0, 16)
const number = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

export default function App() {
  const [markets, setMarkets] = useState<Markets | null>(null)
  const [mode, setMode] = useState<'replay' | 'live'>('replay')
  const modeRef=useRef(mode)
  modeRef.current=mode
  const [replaySelection, setReplaySelection] = useState<Selection>(initial)
  const [liveSelection, setLiveSelection] = useState<Selection>({...initial, asOf: Date.now()})
  const [liveData, setLiveData] = useState<LiveState & {key:string}>({key:'',bars:[],status:'connecting',lastUpdate:null,error:''})
  const replaySession = useRef<Session | null>(null)
  const liveSession = useRef<Session | null>(null)
  const selection = mode === 'replay' ? replaySelection : liveSelection
  const setSelection = mode === 'replay' ? setReplaySelection : setLiveSelection
  const [version, setVersion] = useState('')
  const [restored, setRestored] = useState<Session | null>(null)
  const [replayData, setData] = useState<(BarResponse & { selection: Selection }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [dialog, setDialog] = useState<'data' | 'indicators' | 'drawings' | 'seek' | null>(null)
  const [replayOpen, setReplayOpen] = useState(true)
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
  const chartVersion = mode === 'replay' ? version : 'live'
  const liveMatches = liveData.key === `${liveSelection.symbol}:${liveSelection.timeframe}`
  const data = mode === 'replay' ? replayData : liveMatches && liveData.bars.length ? {
    bars:liveData.bars, selection:{...liveSelection,asOf:liveData.bars.at(-1)!.time+MINUTES[liveSelection.timeframe]*60000},
    asOf:Date.now(),datasetVersion:'live',available:{start:liveData.bars[0].time,end:Date.now()},
  } : null
  const chartSelection = mode === 'replay' ? selection : data?.selection ?? selection
  const renderKey = `${chartSelection.symbol}:${chartSelection.timeframe}:${chartSelection.asOf}:${chartVersion}`
  const pending = (mode === 'replay' && loading) || !data || paintedKey !== renderKey
  const conceal = (mode === 'replay' && !!error) || !canKeepPaintedFrame(paintedKey, chartSelection, chartVersion)

  useEffect(() => {
    let live = true
    void Promise.all([api<Markets>('/markets'), api<Session | null>('/session')]).then(([available, saved]) => {
      if (!live) return
      setMarkets(available)
      if (saved) { replaySession.current=saved; if(modeRef.current==='replay') setRestored(saved); setReplaySelection(saved.selection); setSpeed(saved.speed); setVersion(saved.datasetVersion) }
      else {
        const first = available.markets.find(m => m.symbol === 'BTCUSDT')?.ranges[0]
        if (first) setReplaySelection({ ...initial, asOf: Math.min(first.start+7*86400000, first.end) })
        setVersion(available.datasetVersion)
      }
    }).catch(e => { if (live) { setError(e.message); setLoading(false) } })
    return () => { live = false; latest.current.cancel() }
  }, [])

  useEffect(() => {
    if (mode !== 'replay' || !version || !markets) return
    const selection=replaySelection
    setLoading(true); setError('')
    void latest.current.run(signal => loadBars(selection, version, signal)).then(response => {
      if (!response) return
      if (!response.bars.length) throw new Error('No complete minute is available in the first candle for this timeframe. Choose a later start time.')
      setData({ ...response, selection }); setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false); setPlaying(false) })
    return () => latest.current.cancel()
  }, [replaySelection, version, markets, mode])

  useEffect(() => {
    if (mode !== 'live') return
    setLiveData({key:`${liveSelection.symbol}:${liveSelection.timeframe}`,bars:[],status:'connecting',lastUpdate:null,error:''})
    const feed=new LiveFeed(liveSelection.symbol,liveSelection.timeframe,state=>setLiveData({...state,key:`${liveSelection.symbol}:${liveSelection.timeframe}`}))
    feed.start()
    return () => feed.stop()
  }, [mode,liveSelection.symbol,liveSelection.timeframe])

  const step = useCallback(() => {
    if (mode !== 'replay' || !data || pending || error) return
    const next = Math.min(nextBoundary(selection.asOf, selection.timeframe), data.available.end)
    if (next <= selection.asOf) { setPlaying(false); return }
    setSelection(current => ({ ...current, asOf: next }))
  }, [data, pending, error, selection, mode])

  useEffect(() => {
    if (mode !== 'replay' || !playing || pending) return
    if (error || (data && selection.asOf >= data.available.end)) { setPlaying(false); return }
    const timer = setTimeout(step, 1000/speed)
    return () => clearTimeout(timer)
  }, [playing, pending, speed, step, error, data, selection.asOf, mode])

  const snapshot = useCallback((): Session | null => {
    if (!bridge.current || !data || pending || (mode === 'replay' && error)) return null
    return { schemaVersion: 1, selection, speed, datasetVersion: data.datasetVersion, ...bridge.current.snapshot() }
  }, [data, selection, speed, pending, error, mode])

  const save = useCallback(async () => {
    const payload = snapshot()
    if (!payload) return
    const revision = ++saveRevision.current
    try {
      setSaveState('Saving…')
      if (mode === 'replay') { replaySession.current=payload; await writer.current.write(payload) }
      else { liveSession.current=payload; localStorage.setItem('perp-live-session',JSON.stringify(payload)) }
      if (revision === saveRevision.current) setSaveState('Saved locally')
    } catch (e) { if (revision === saveRevision.current) setSaveState(e instanceof Error ? `Unable to save: ${e.message}` : 'Unable to save') }
  }, [snapshot,mode])

  useEffect(() => {
    if (!bridgeReady || (mode==='replay' && (loading || error))) return
    const timer = setTimeout(() => { void save() }, 900)
    return () => clearTimeout(timer)
  }, [revision, bridgeReady, save, loading, error])

  const liveSave = useRef(save)
  liveSave.current=save
  useEffect(()=>{
    if(mode!=='live') return
    const timer=setInterval(()=>{void liveSave.current()},5000)
    return ()=>clearInterval(timer)
  },[mode])

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
      if (mode !== 'replay' || dialog || target.closest('input, textarea, select, button, [contenteditable]')) return
      if (event.code === 'Space') { event.preventDefault(); if (playing || (!pending && !error)) setPlaying(p => !p) }
      if (event.code === 'ArrowRight' && event.altKey) { event.preventDefault(); step() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [dialog, pending, playing, error, step, mode])

  // Hide the prior frame synchronously on selection changes and until Vela has
  // accepted the new prefix. A backwards seek must not flash future candles.
  const last = !pending && (mode === 'live' || !error) ? data?.bars.at(-1) : undefined
  const change = last ? (last.close-last.open)/last.open*100 : 0
  const currentMarket = markets?.markets.find(m => m.symbol === selection.symbol)
  const available = data?.selection.symbol === selection.symbol ? data.available : currentMarket?.ranges[0]
  const reachedEnd = !!data && selection.asOf >= data.available.end

  const seekForm = <form className="seek-form" onSubmit={event => {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('replayTime')
    if (typeof value === 'string' && value) { seek(Date.parse(value+'Z')); setDialog(null) }
  }}>
    <p className="helper">Choose the time up to which candles are revealed. All times are in UTC.</p>
    <label>Replay time · UTC<input key={selection.asOf} name="replayTime" type="datetime-local" defaultValue={datetimeValue(selection.asOf)} min={available ? datetimeValue(available.start+60000) : '2023-01-01T00:01'} max={available ? datetimeValue(available.end) : undefined} required /></label>
    <div className="timeline"><span>{available ? formatUTC(available.start) : '2023'}</span><label className="sr-only" htmlFor="timeline">Seek replay</label><input id="timeline" type="range" min={available ? available.start+60000 : initial.asOf} max={available?.end ?? initial.asOf+60000} step={60000} value={selection.asOf} disabled={!available} onChange={e => seek(Number(e.target.value))} /><span>{available ? formatUTC(available.end) : '—'}</span></div>
    <button className="primary" type="submit">Go to time</button>
  </form>

  const changeSelection = (patch:Partial<Selection>) => {
    setPlaying(false)
    if((patch.symbol ?? selection.symbol)===selection.symbol && (patch.timeframe ?? selection.timeframe)===selection.timeframe) return
    if(mode==='live') {
      const captured=snapshot()
      if(captured) { liveSession.current=captured;setRestored(captured);try {localStorage.setItem('perp-live-session',JSON.stringify(captured))} catch {setSaveState('Unable to save the Live session')} }
      setBridgeReady(false)
    }
    setSelection(current=>({...current,...patch}))
  }

  const switchMode = (target:'live'|'replay') => {
    if (target===mode) return
    setPlaying(false); setDialog(null);setSaveState('')
    const captured=snapshot() ?? (mode==='replay' && replaySession.current ? { ...replaySession.current, selection:replaySelection, speed, datasetVersion:version, ...(bridgeReady ? bridge.current?.snapshot() : {}) } : null)
    if (captured) {
      if(mode==='replay') { replaySession.current=captured; void writer.current.write(captured).catch(()=>setSaveState('Unable to save')) }
      else { liveSession.current=captured; try { localStorage.setItem('perp-live-session',JSON.stringify(captured)) } catch { setSaveState('Unable to save the Live session') } }
    }
    if(target==='live' && !liveSession.current) {
      try { liveSession.current=JSON.parse(localStorage.getItem('perp-live-session') || 'null') } catch { /* first session */ }
      if(!liveSession.current && captured) {
        liveSession.current=seedLiveSession(captured,Date.now())
        setLiveSelection({...selection,asOf:Date.now()})
      } else if(liveSession.current) setLiveSelection({...liveSession.current.selection,asOf:Date.now()})
    }
    // Appearance is shared; drawings, viewports and replay clock stay isolated.
    const appearance=captured?.chartsBySymbol[selection.symbol]?.renderer
    const restore=restoreWithAppearance(target==='live'?liveSession.current:replaySession.current,appearance)
    setRestored(restore);setBridgeReady(false);setPaintedKey('');setMode(target)
  }

  const openSettings = () => { setPlaying(false); bridge.current?.chart.renderer.openSettings() }
  const openPanel = (panel: 'data' | 'indicators' | 'drawings' | 'seek') => { setPlaying(false); setDialog(panel) }

  return <div className="app terminal">
    <a className="skip-link" href="#chart-area">Skip to chart</a>
    <header className="app-header terminal-toolbar">
      <h1 className="terminal-brand" title="Perp Replay"><BarChartIcon /><span className="sr-only">Perp Replay</span></h1>
      <div className="market-group"><label className="sr-only" htmlFor="market">Pair</label><select id="market" value={selection.symbol} onChange={e => changeSelection({symbol:e.target.value as Symbol})}><option value="BTCUSDT">BTCUSDT</option><option value="ETHUSDT">ETHUSDT</option><option value="SOLUSDT">SOLUSDT</option></select></div>
      <div className="toolbar-divider" />
      <div className="timeframes" role="group" aria-label="Timeframe">{TIMEFRAMES.map(tf => <button key={tf} aria-pressed={selection.timeframe === tf} onClick={() => changeSelection({timeframe:tf})}>{tf}</button>)}</div>
      <div className="toolbar-divider" />
      <button className="quiet indicators-action" onClick={() => openPanel('indicators')} disabled={!bridgeReady || !data}><BarChartIcon />Indicators</button>
      <div className="mode-switch" role="group" aria-label="Chart mode"><button aria-pressed={mode==='live'} onClick={()=>switchMode('live')}>Live</button><button aria-pressed={mode==='replay'} onClick={()=>switchMode('replay')}>Replay</button></div>
      {mode==='replay' ? <button className="quiet replay-toggle" aria-pressed={replayOpen} onClick={() => { setPlaying(false); setReplayOpen(v => !v) }}><TrackNextIcon />Replay controls</button> : null}
      <div className="toolbar-tail"><a className="layout-name" href="/compare.html" target="_blank" rel="noreferrer">OpenCharts preview ↗</a><span className="save-status" role="status">{saveState === 'Saved locally' ? <CheckIcon /> : null}{saveState}</span></div>
      <button className="icon-button" aria-label="Chart settings" title="Chart settings" disabled={!bridgeReady || !data} onClick={openSettings}><GearIcon /></button>
      <button className="icon-button fullscreen-action" aria-label="Full screen" title="Full screen" onClick={() => {
        const action = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()
        void action.catch(() => setSaveState('Full screen is not available in this browser.'))
      }}><EnterFullScreenIcon /></button>
    </header>
    <div className="terminal-body">
      <main id="chart-area" className="workspace">
        <section className="chart-container" aria-label={mode==='live'?'Live chart':'Replay chart'} aria-busy={pending}>
          <div className={`chart-wrapper ${conceal ? 'concealed' : ''}`}>{data ? <Chart key={mode} mode={mode} selection={data.selection} bars={data.bars} restored={restored} onReady={onReady} onChange={onChange} onPainted={onPainted} renderKey={`${data.selection.symbol}:${data.selection.timeframe}:${data.selection.asOf}:${data.datasetVersion}`} /> : null}</div>
          {!conceal ? <div className="chart-readout" aria-label={mode==='live'?'Current candle':'Last revealed candle'}><span className="instrument-title"><span className="instrument-mark">{selection.symbol === 'BTCUSDT' ? 'B' : selection.symbol === 'ETHUSDT' ? 'E' : 'S'}</span>{selection.symbol} · {selection.timeframe} · BINANCE USD-M</span><div className={`ohlc ${change >= 0 ? 'positive' : 'negative'}`}>{(['open', 'high', 'low', 'close'] as const).map((key,i) => <span key={key}><small>{['O','H','L','C'][i]}</small>{last ? number(last[key]) : '—'}</span>)}<span>{last ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}</span></div></div> : null}
          {mode==='replay' && error ? <div className="chart-message"><h2>Waiting for chart data</h2><p role="alert">{error}</p><div><button className="primary" onClick={() => openPanel('data')}>Manage data</button><button onClick={refresh}><ReloadIcon />Try again</button></div></div> : pending && conceal ? <div className="chart-message loading"><div className="loading-bars"><i /><i /><i /><i /><i /></div><p>{mode==='live'?'Connecting to Binance Live…':'Loading historical candles…'}</p></div> : pending ? <div className="chart-loading-note">Loading more candles…</div> : null}
        </section>
        {mode==='replay' && replayOpen ? <div className="replay-controls terminal-replay">
          <button className="quiet select-bar" onClick={() => openPanel('seek')}><CalendarIcon />Select time</button>
          <div className="replay-divider" />
          <div className="transport"><button className="play-button" aria-label={playing ? 'Pause replay' : 'Play replay'} title="Space" disabled={!playing && (pending || !!error || reachedEnd)} onClick={() => setPlaying(p => !p)}>{playing ? <PauseIcon /> : <PlayIcon />}</button><button className="icon-button" aria-label="Next candle" title="Alt + →" disabled={pending || !!error || reachedEnd} onClick={step}><TrackNextIcon /></button><label className="sr-only" htmlFor="speed">Replay speed</label><select id="speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[0.25, 0.5, 1, 2, 5, 10, 20].map(v => <option key={v} value={v}>{v}×</option>)}</select><span className="step-timeframe">{selection.timeframe}</span></div>
          <button className="quiet cursor-time" title="Change replay time" onClick={() => openPanel('seek')}>{formatUTC(selection.asOf)}<span>UTC</span></button>
          <span className="play-state">{playing ? 'Playing' : reachedEnd ? 'End of history' : 'Paused'}</span>
        </div> : null}
        {mode==='live' ? <div className={`live-connection ${liveData.status}`} role="status"><span className="connection-dot" />{liveData.status==='live'?'Live · Binance USD-M':liveData.status==='stale'?'Stale data · reconnecting':liveData.status==='syncing'?'Syncing candles…':'Connecting…'}<span>{liveData.lastUpdate ? `Last update ${new Date(liveData.lastUpdate).toISOString().slice(11,19)} UTC` : 'Waiting for the first update'}{liveData.status==='stale' && liveData.error ? ` · ${liveData.error}`:''}</span></div> : null}
        <footer className="status-bar"><span className="status-replay">{mode==='live'?'● Live':'◂ Replay'}</span><span>{selection.symbol} · {selection.timeframe}</span><span className="status-local">{mode==='live'?'Public live data · no account required':'Local historical data'}</span><a href="https://velacharts.dev" target="_blank" rel="noreferrer">Vela</a><span className="status-clock">{mode==='live' ? (liveData.lastUpdate ? formatUTC(liveData.lastUpdate) : '—') : formatUTC(selection.asOf)} UTC</span></footer>
      </main>
      <aside className="utility-rail" aria-label="Panels and tools">
        <button className="rail-button" title="Historical data" aria-label="Manage data" onClick={() => openPanel('data')}><DownloadIcon /></button>
        <button className="rail-button" title="Indicators" aria-label="Indicators" onClick={() => openPanel('indicators')} disabled={!bridgeReady || !data}><BarChartIcon /></button>
        <button className="rail-button" title="Drawing tools" aria-label="Drawing tools" onClick={() => openPanel('drawings')} disabled={!bridgeReady || !data}><Pencil1Icon /></button>
        <div className="rail-divider" />
        <button className="rail-button" title="Reset chart range" aria-label="Reset chart range" onClick={() => {
          if (data?.bars.length && bridge.current) bridge.current.chart.setVisibleRange({ from: data.bars[Math.max(0, data.bars.length-160)].time, to: data.bars.at(-1)!.time+MINUTES[selection.timeframe]*60_000*10 })
        }}><ResetIcon /></button>
        <div className="rail-spacer" />
        <button className="rail-button" aria-label="Save session" title="Save session" disabled={!bridgeReady || pending || (mode==='replay' && !!error)} onClick={() => void save()}><CheckIcon /></button>
        <button className="rail-button" aria-label="Export session" title="Export session as JSON" disabled={!bridgeReady || pending || (mode==='replay' && !!error)} onClick={() => { const s = snapshot(); if (s) downloadSession(s) }}><DownloadIcon /></button>
        <button className="rail-button" aria-label="Chart appearance" title="Chart appearance" disabled={!bridgeReady || !data} onClick={openSettings}><GearIcon /></button>
      </aside>
    </div>
    {dialog ? <Dialog title={dialog === 'data' ? 'Historical data' : dialog === 'drawings' ? 'Drawing tools' : dialog === 'seek' ? 'Select replay time' : 'Indicators'} onClose={() => setDialog(null)}>{dialog === 'data' ? <DataPanel markets={markets} onRefresh={refresh} /> : dialog === 'drawings' ? <DrawingTools bridge={bridge.current} onChoose={() => setDialog(null)} /> : dialog === 'seek' ? seekForm : <Indicators bridge={bridge.current} />}</Dialog> : null}
  </div>
}
