import { useEffect, useMemo, useRef, useState } from 'react'
import { ChartPanel, ChartSettingsDialog, OpenChartsProvider, useChartPreferences, type DrawingLine, type DrawingTool, type IndicatorType } from '@dylanpersonguy/opencharts'
import { GearIcon, PauseIcon, PlayIcon, TrackNextIcon } from '@radix-ui/react-icons'
import { api, loadBars, type Bar, type Markets } from '../api'
import { LiveFeed, type LiveState } from '../live'
import { LatestRequest, nextBoundary, TIMEFRAMES, type Selection, type Symbol } from '../replay'
import type { Session } from '../sessions'
import { previewAdapter } from './adapter'
import { visibleDrawings, type Frame } from './data'

type Mode='replay'|'live'
type SavedDrawing={asOf:number;drawing:DrawingLine}
type Drawings=Record<string,SavedDrawing[]>
const initial:Selection={symbol:'BTCUSDT',timeframe:'5m',asOf:Date.UTC(2023,0,8)}
const stamp=(time:number)=>new Date(time).toISOString().slice(0,16)
function read<T>(key:string,fallback:T):T {try{return JSON.parse(localStorage.getItem('opencharts-preview:'+key) ?? 'null') ?? fallback}catch{return fallback}}
const keyFor=(mode:Mode,s:Selection)=>`${mode}:${s.symbol}:${s.timeframe}:${mode==='replay'?s.asOf:0}`
const indicators:IndicatorType[]=['SMA','EMA','RSI','MACD','BOLL','ATR','STOCH','VWAP']

export default function Preview() {
  const [ready,setReady]=useState(false)
  const [version,setVersion]=useState('')
  const [markets,setMarkets]=useState<Markets|null>(null)
  const [mode,setMode]=useState<Mode>('replay')
  const [replay,setReplay]=useState<Selection>(initial)
  const [live,setLive]=useState<Selection>({...initial,asOf:Date.now()})
  const selection=mode==='replay'?replay:live
  const [frame,setFrame]=useState<(Frame&{key:string})|null>(null)
  const frameRef=useRef<Frame>({symbol:'',timeframe:'',bars:[]})
  const adapter=useMemo(()=>previewAdapter(()=>frameRef.current),[])
  const [error,setError]=useState('')
  const [health,setHealth]=useState<LiveState['status']>('connecting')
  const [updated,setUpdated]=useState<number|null>(null)
  const latest=useRef(new LatestRequest<Bar[]>())
  const [epoch,setEpoch]=useState(0)
  const [playing,setPlaying]=useState(false)
  const [speed,setSpeed]=useState(1)
  const [drawings,setDrawings]=useState<Drawings>(()=>read('drawings',{}))
  const [active,setActive]=useState<IndicatorType[]>(()=>read('indicators',['EMA']))
  const [tool,setTool]=useState<DrawingTool>('none')
  const [settings,setSettings]=useState(false)
  const [showIndicators,setShowIndicators]=useState(false)
  const [storageError,setStorageError]=useState('')
  const target=keyFor(mode,selection)
  const safe=frame?.key===target
  const renderable=frame?.key.startsWith(`${mode}:${selection.symbol}:${selection.timeframe}:`) && (mode==='live' || Number(frame.key.split(':')[3])<=selection.asOf)
  // Rendering/pagination cannot access the prior market or a later replay prefix.
  frameRef.current=safe && frame?frame:{symbol:'',timeframe:'',bars:[]}
  const drawingKey=mode+':'+selection.symbol
  const available=markets?.markets.find(m=>m.symbol===selection.symbol)?.ranges[0]
  const shown=visibleDrawings(drawings[drawingKey] ?? [],mode,selection.asOf).map(item=>item.drawing)
  useEffect(()=>{
    let mounted=true
    void Promise.all([api<Markets>('/markets'),api<Session|null>('/session')]).then(([m,s])=>{
      if(!mounted)return
      setMarkets(m);setVersion(s?.datasetVersion ?? m.datasetVersion)
      setReplay(read('replay',s?.selection ?? initial));setReady(true)
    }).catch(e=>setError(e.message))
    return()=>{mounted=false;latest.current.cancel()}
  },[])
  useEffect(()=>{
    if(!ready)return
    setError('')
    if(mode==='live') {
      const feed=new LiveFeed(selection.symbol,selection.timeframe,state=>{
        setHealth(state.status);setUpdated(state.lastUpdate);setError(state.error)
        if(state.bars.length)setFrame({symbol:selection.symbol,timeframe:selection.timeframe,bars:state.bars,key:target})
      })
      feed.start();return()=>feed.stop()
    }
    void latest.current.run(async signal=>(await loadBars(selection,version,signal)).bars).then(bars=>{
      if(bars)setFrame({symbol:selection.symbol,timeframe:selection.timeframe,bars,key:target})
    }).catch(e=>{setError(e.message);setPlaying(false)})
    return()=>latest.current.cancel()
  },[ready,mode,selection.symbol,selection.timeframe,selection.asOf,version])
  useEffect(()=>{
    if(!ready)return
    try {for(const [key,value] of Object.entries({drawings,indicators:active,replay}))localStorage.setItem('opencharts-preview:'+key,JSON.stringify(value));setStorageError('')}
    catch {setStorageError('Unable to save preview locally. Export drawings before closing.')}
  },[ready,drawings,active,replay])
  const choose=(patch:Partial<Selection>)=>{
    setPlaying(false);setTool('none')
    const next={...selection,...patch}
    if(next.symbol!==selection.symbol || next.timeframe!==selection.timeframe || next.asOf<selection.asOf)setEpoch(e=>e+1)
    ;(mode==='replay'?setReplay:setLive)(next)
  }
  const step=()=>{if(!safe || error || !available)return;const time=Math.min(nextBoundary(replay.asOf,replay.timeframe),available.end);if(time===replay.asOf)setPlaying(false);else setReplay(s=>({...s,asOf:time}))}
  useEffect(()=>{
    if(!playing || !safe || mode!=='replay' || error)return
    const timer=setTimeout(step,1000/speed);return()=>clearTimeout(timer)
  },[playing,safe,mode,error,replay,speed])
  const edit=(drawing:DrawingLine)=>setDrawings(all=>({...all,[drawingKey]:(all[drawingKey] ?? []).map(item=>item.drawing.id===drawing.id?{...item,drawing}:item)}))
  const changeMode=(next:Mode)=>{if(next===mode)return;setPlaying(false);setTool('none');setSettings(false);setEpoch(e=>e+1);setMode(next)}
  return <div className="compare-app">
    <header className="compare-toolbar">
      <a href="/" target="_blank" rel="noreferrer" className="back-link">← Vela</a>
      <label className="sr-only" htmlFor="preview-market">Pair</label><select id="preview-market" value={selection.symbol} onChange={e=>choose({symbol:e.target.value as Symbol})}>{['BTCUSDT','ETHUSDT','SOLUSDT'].map(s=><option key={s}>{s}</option>)}</select>
      <div className="compare-timeframes" role="group" aria-label="Timeframe">{TIMEFRAMES.map(tf=><button key={tf} aria-pressed={selection.timeframe===tf} onClick={()=>choose({timeframe:tf})}>{tf}</button>)}</div>
      <button onClick={()=>setShowIndicators(v=>!v)} aria-expanded={showIndicators}>Indicators</button>
      <div className="compare-modes" role="group" aria-label="Chart mode">{(['live','replay'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>changeMode(m)}>{m==='live'?'Live':'Replay'}</button>)}</div>
      <span className="preview-label">OpenCharts preview</span>
      <button aria-label="Chart settings" title="Chart settings" onClick={()=>setSettings(true)}><GearIcon/></button>
    </header>
    {showIndicators?<div className="compare-indicators" role="group" aria-label="Indicators">{indicators.map(ind=><button key={ind} aria-pressed={active.includes(ind)} onClick={()=>setActive(list=>list.includes(ind)?list.filter(v=>v!==ind):[...list,ind])}>{ind}</button>)}</div>:null}
    <main className="compare-chart">
      {ready?<OpenChartsProvider adapter={adapter}>
        <div className="controlled-chart" style={{visibility:safe?'visible':'hidden'}}>
          {renderable && frame?.bars.length?<ChartPanel key={`${mode}:${epoch}`} candles={chartWindowForPanel(frame)} selectedSymbol={selection.symbol} timeframe={selection.timeframe} isDark activeIndicators={active} drawingTool={tool} drawings={shown}
            onAddDrawing={drawing=>setDrawings(all=>({...all,[drawingKey]:[...(all[drawingKey] ?? []),{asOf:selection.asOf,drawing}]}))}
            onUpdateDrawing={edit} onRemoveDrawing={id=>setDrawings(all=>({...all,[drawingKey]:(all[drawingKey] ?? []).filter(item=>item.drawing.id!==id)}))}
            onDrawingToolSelect={setTool} onDrawingComplete={()=>setTool('none')} onClearDrawings={()=>setDrawings(all=>({...all,[drawingKey]:[]}))} onClearIndicators={()=>setActive([])}
            showNews={false} showLastPrice positions={[]} orders={[]} pipDigits={selection.symbol==='SOLUSDT'?3:2} isReplaying={mode==='replay'} />:null}
        </div>
        <PreviewSettings open={settings} onClose={()=>setSettings(false)}/>
      </OpenChartsProvider>:null}
      {!safe || (mode==='replay' && error)?<div className="compare-message" role="status">{error || (mode==='live'?'Connecting to Binance Live…':'Loading safe replay candles…')}</div>:null}
    </main>
    {mode==='replay'?<div className="compare-replay">
      <form className="compare-seek" onSubmit={e=>{e.preventDefault();const value=new FormData(e.currentTarget).get('time');if(typeof value==='string'){const time=Date.parse(value+'Z');if(Number.isFinite(time))choose({asOf:time})}}}><label>Replay time · UTC<input key={replay.asOf} name="time" aria-label="Replay time · UTC" type="datetime-local" defaultValue={stamp(replay.asOf)} min={available?stamp(available.start+60000):undefined} max={available?stamp(available.end):undefined} required/></label><button type="submit">Go</button></form>
      <button aria-label={playing?'Pause replay':'Play replay'} disabled={!playing && (!safe || !!error)} onClick={()=>setPlaying(v=>!v)}>{playing?<PauseIcon/>:<PlayIcon/>}</button>
      <button aria-label="Next candle" disabled={!safe || !!error} onClick={step}><TrackNextIcon/></button>
      <select aria-label="Replay speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[0.5,1,2,5,10].map(n=><option key={n} value={n}>{n}×</option>)}</select>
      <span>{playing?'Playing':'Paused'}</span>
    </div>:<div className={`compare-live ${health}`} role="status">{health==='live'?'● Live · Binance USD-M':health==='stale'?'● Stale data · reconnecting':'● Connecting / syncing candles…'}<span>{updated?`Last update ${new Date(updated).toISOString().slice(11,19)} UTC`:''}</span>{error?<span>{error}</span>:null}</div>}
    <footer className="compare-footer"><span>{mode==='live'?'Live':'Replay'} · {selection.symbol} · {selection.timeframe}</span><span>{storageError || 'Separate preview storage · Vela sessions preserved'}</span><a href="https://github.com/dylanpersonguy/OpenCharts" target="_blank" rel="noreferrer">OpenCharts · MIT</a></footer>
  </div>
}
function chartWindowForPanel(frame:Frame) {return frame.bars.map(bar=>({...bar,time:bar.time/1000}))}
function PreviewSettings({open,onClose}:{open:boolean;onClose:()=>void}) {
  const prefs=useChartPreferences()
  return <ChartSettingsDialog open={open} onClose={onClose} prefs={prefs} isDark activePlugins={[]} hasAccount={false} onOpenNewsConfig={onClose}/>
}
