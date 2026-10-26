import {useEffect,useMemo,useRef,useState,type CSSProperties} from 'react'
import {OpenChartsProvider,ChartSettingsDialog,useChartPreferences,type IndicatorType} from '@dylanpersonguy/opencharts'
import {GearIcon} from '@radix-ui/react-icons'
import type {Markets} from '../api'
import {nextBoundary,TIMEFRAMES,type Symbol,type Timeframe} from '../replay'
import {loadOpenChartsBootstrap} from './bootstrap'
import {previewAdapter} from './adapter'
import {ChartCell,type DrawingStore,type CellStatus} from './ChartCell'
import {ChartBus} from './chartBus'
import {changeCell,initialWorkspace,loadWorkspace,visibleIds,studyTypes,type Layout,type Workspace} from './workspace'
import {applyModifierKey,defaultStudy,normalizeStudy,type Magnet,type StudySettings} from './studies'
import {StudySettingsDialog} from './StudySettings'
import {ActiveChartMaximizeButton,CellCaption,createWorkspaceBackup,IndicatorToolbarButton,LiveTransport,PairSelector,ReplayTransport,shouldShowCellCaption,WorkspaceDrawingRailHost,WorkspaceStatusBar,WorkspaceUtilityRail} from './WorkspaceChrome'
const prefix='opencharts-preview:'
function read<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(prefix+key)??'null')??fallback}catch{return fallback}}
const layouts:{id:Layout;label:string;icon:string}[]=[{id:'one',label:'Single chart',icon:'□'},{id:'columns',label:'Two side by side',icon:'▥'},{id:'rows',label:'Two stacked',icon:'▤'},{id:'three',label:'One large + two',icon:'◧'},{id:'four',label:'Four charts',icon:'⊞'}]
export default function Preview(){
 const [w,setW]=useState<Workspace>(()=>loadWorkspace(read('workspace',null))),[ready,setReady]=useState(false),[version,setVersion]=useState(''),[markets,setMarkets]=useState<Markets|null>(null),[mode,setMode]=useState<'replay'|'live'>('replay'),[liveCells,setLiveCells]=useState(()=>loadWorkspace(read('live-workspace',null)).cells)
 const [drawings,setDrawings]=useState<DrawingStore>(()=>read('workspace-drawings',Object.fromEntries(Object.entries(read<DrawingStore>('drawings',{})).map(([k,v])=>['chart-1:'+k,v])))),[settings,setSettings]=useState(false),[indicatorsOpen,setIndicatorsOpen]=useState(false),[layoutOpen,setLayoutOpen]=useState(false),[sidebar,setSidebar]=useState(()=>read('sidebar',false)),[maximized,setMaximized]=useState<string|null>(null),[studyEdit,setStudyEdit]=useState<{cell:string;type:IndicatorType}|null>(null),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1),[reset,setReset]=useState(0),[statuses,setStatuses]=useState<Record<string,CellStatus>>({}),[error,setError]=useState(''),[storageError,setStorageError]=useState('')
 const [magnet,setMagnet]=useState<Magnet>(()=>read('magnet','none')),[stay,setStay]=useState(()=>read('stay',false)),[held,setHeld]=useState(false)
 const [drawingRailHost,setDrawingRailHost]=useState<HTMLDivElement|null>(null)
 const bus=useMemo(()=>new ChartBus(read('views',{}),views=>{try{localStorage.setItem(prefix+'views',JSON.stringify(views))}catch{/* Other workspace writes expose the storage error. */}}),[]),adapter=useMemo(()=>previewAdapter(()=>({symbol:'',timeframe:'',bars:[]})),[])
 const current=mode==='live'?{...w,cells:liveCells}:w,ids=maximized?[maximized]:visibleIds(w),activeId=ids.includes(w.active)?w.active:ids[0],active=current.cells.find(c=>c.id===activeId)!,available=markets?.markets.find(m=>m.symbol===active.symbol)?.ranges[0]
 const allReady=ids.every(id=>statuses[id]?.ready&&!statuses[id]?.error)
 useEffect(()=>{let mounted=true;void loadOpenChartsBootstrap().then(({markets:m,version:v})=>{if(!mounted)return;setMarkets(m);setVersion(v);if(!read('workspace',null)){setW(prev=>({...prev,asOf:read('replay',{asOf:prev.asOf}).asOf}))}setReady(true)}).catch(e=>setError(e.message));return()=>{mounted=false}},[])
 useEffect(()=>{if(!ready)return;try{for(const [k,v]of Object.entries({workspace:w,'live-workspace':{...w,cells:liveCells},'workspace-drawings':drawings,magnet,stay,sidebar}))localStorage.setItem(prefix+k,JSON.stringify(v));setStorageError('')}catch{setStorageError('Unable to save workspace locally. Export a backup before closing.')}},[ready,w,liveCells,drawings,magnet,stay,sidebar])
 useEffect(()=>{bus.syncTime=w.syncTime;bus.syncCrosshair=w.syncCrosshair;if(w.syncTime)bus.refresh()},[bus,w.syncTime,w.syncCrosshair])
 useEffect(()=>{
  let keys=new Set<string>()
  const blocked=(t:EventTarget|null)=>t instanceof HTMLElement&&!!t.closest('input,textarea,select,[contenteditable=true],dialog')
  const sync=(next:Set<string>)=>{keys=next;setHeld(keys.has('Meta')||keys.has('Control'))}
  const down=(e:KeyboardEvent)=>{if(blocked(e.target))return;sync(applyModifierKey(keys,e))}
  const up=(e:KeyboardEvent)=>sync(applyModifierKey(keys,e)),clear=()=>sync(applyModifierKey(keys,{type:'blur'})),visibility=()=>{if(document.hidden)clear()}
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',visibility)
  return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',visibility)}
 },[])
 function patchCell(id:string,patch:Parameters<typeof changeCell>[2]){setPlaying(false);if(mode==='replay')setW(v=>changeCell(v,id,patch));else setLiveCells(v=>v.map(c=>c.id===id?{...c,...patch}:c))}
 function changeStudy(id:string,type:IndicatorType,s:StudySettings){const c=current.cells.find(c=>c.id===id)!;patchCell(id,{studies:{...c.studies,[type]:normalizeStudy(type,s)}})}
 function toggleIndicator(type:IndicatorType){patchCell(activeId,{indicators:active.indicators.includes(type)?active.indicators.filter(t=>t!==type):[...active.indicators,type]})}
 function seek(time:number){if(!available||!Number.isFinite(time))return;time=Math.min(available.end,Math.max(available.start+60000,time));setPlaying(false);if(time<w.asOf)setReset(n=>n+1);setW(v=>({...v,asOf:time}))}
 function step(){if(!allReady||!available)return;const time=Math.min(nextBoundary(w.asOf,active.timeframe),available.end);if(time===w.asOf)setPlaying(false);else setW(v=>({...v,asOf:time}))}
 useEffect(()=>{if(!playing||!allReady||mode!=='replay')return;const timer=setTimeout(step,1000/speed);return()=>clearTimeout(timer)},[playing,allReady,mode,w.asOf,active.timeframe,speed])
 function changeMode(m:'live'|'replay'){if(m===mode)return;setPlaying(false);setHeld(false);setSettings(false);setStudyEdit(null);setReset(n=>n+1);setStatuses({});setMode(m)}
 function setLayout(layout:Layout){setPlaying(false);setMaximized(null);setW(v=>{const next={...v,layout};return {...next,active:visibleIds(next).includes(v.active)?v.active:'chart-1'}});setLayoutOpen(false)}
 function exportWorkspace(){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(createWorkspaceBackup({workspace:w,liveWorkspace:liveCells,drawings,magnet,stay}),null,2)],{type:'application/json'}));a.href=url;a.download='perp-workspace-backup.json';a.click();URL.revokeObjectURL(url)}
 const split=useRef<{axis:'column'|'row';start:number;size:number;value:number}|null>(null),gridRef=useRef<HTMLDivElement>(null)
 function divider(axis:'column'|'row'){return <div key={axis} className={`workspace-divider ${axis}`} role="separator" aria-label={`Resize chart ${axis}s`} aria-orientation={axis==='column'?'vertical':'horizontal'} aria-valuemin={25} aria-valuemax={75} aria-valuenow={w[axis]} tabIndex={0} onPointerDown={e=>{const r=gridRef.current!.getBoundingClientRect();split.current={axis,start:axis==='column'?e.clientX:e.clientY,size:axis==='column'?r.width:r.height,value:w[axis]};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=split.current;if(d){const pos=d.axis==='column'?e.clientX:e.clientY;setW(v=>({...v,[d.axis]:Math.max(25,Math.min(75,d.value+100*(pos-d.start)/d.size))}))}}} onPointerUp={()=>{split.current=null}} onLostPointerCapture={()=>{split.current=null}} onKeyDown={e=>{const negative=axis==='column'?'ArrowLeft':'ArrowUp',positive=axis==='column'?'ArrowRight':'ArrowDown';if(e.key===negative||e.key===positive){e.preventDefault();setW(v=>({...v,[axis]:Math.min(75,Math.max(25,v[axis]+(e.key===positive?2:-2)))}))}}}/>}
 const edited=studyEdit?current.cells.find(c=>c.id===studyEdit.cell):null
 return <OpenChartsProvider adapter={adapter}><div className="compare-app">
  <header className="compare-toolbar">
   <span className="back-link" aria-label="Perp Replay workspace">Perp Replay</span>
   <PairSelector value={active.symbol} onChange={symbol=>patchCell(activeId,{symbol})}/>
   <div className="compare-timeframes" role="group" aria-label="Timeframe">{TIMEFRAMES.map(tf=><button key={tf} aria-pressed={active.timeframe===tf} onClick={()=>patchCell(activeId,{timeframe:tf})}>{tf}</button>)}</div>
   <IndicatorToolbarButton expanded={indicatorsOpen} onToggle={()=>{setIndicatorsOpen(v=>!v);setLayoutOpen(false)}}/>
   <div className="compare-modes" role="group" aria-label="Chart mode">{(['live','replay'] as const).map(m=><button key={m} aria-pressed={mode===m} onClick={()=>changeMode(m)}>{m==='live'?'Live':'Replay'}</button>)}</div>
   <div className="toolbar-spacer"/>
   <ActiveChartMaximizeButton maximized={Boolean(maximized)} onToggle={()=>setMaximized(maximized?null:activeId)}/>
  </header>
  {layoutOpen?<div className="workspace-popover layout-popover"><h2>Chart layout</h2><div className="layout-options">{layouts.map(l=><button key={l.id} aria-pressed={w.layout===l.id} onClick={()=>setLayout(l.id)}><span>{l.icon}</span>{l.label}</button>)}</div><label><input type="checkbox" checked={w.syncTime} onChange={e=>setW(v=>({...v,syncTime:e.target.checked}))}/>Sync time & scrolling</label><label><input type="checkbox" checked={w.syncCrosshair} onChange={e=>setW(v=>({...v,syncCrosshair:e.target.checked}))}/>Sync crosshair</label><p>Pair and timeframe stay independent.</p><button onClick={()=>setLayoutOpen(false)}>Close</button></div>:null}
  {indicatorsOpen?<div className="workspace-popover indicator-popover"><h2>Indicators · {active.symbol} · {active.timeframe}</h2>{studyTypes.map(t=><div key={t}><button aria-pressed={active.indicators.includes(t)} onClick={()=>toggleIndicator(t)}>{t}<span>{['RSI','MACD','ATR','STOCH'].includes(t)?'Separate pane':'Price overlay'}</span></button>{active.indicators.includes(t)?<button aria-label={`${t} input and style settings`} onClick={()=>{setStudyEdit({cell:activeId,type:t});setIndicatorsOpen(false)}}><GearIcon/></button>:null}</div>)}<button onClick={()=>setIndicatorsOpen(false)}>Close</button></div>:null}
  <main className="workspace-main">
   <WorkspaceDrawingRailHost setHost={setDrawingRailHost}/>
   <div ref={gridRef} className={`workspace-grid layout-${maximized?'one':w.layout}`} style={{'--column':w.column+'%','--row':w.row+'%'} as CSSProperties}>
    {ready?ids.map((id,i)=>{const c=current.cells.find(c=>c.id===id)!;return <section key={id} className={`workspace-cell cell-${i+1} ${activeId===id?'is-active':''}`} aria-label={`Chart ${i+1} · ${c.symbol} · ${c.timeframe}`} onPointerDownCapture={()=>{if(activeId!==id){setPlaying(false);setW(v=>({...v,active:id}))}}} onFocusCapture={()=>{if(activeId!==id)setW(v=>({...v,active:id}))}}>
     {shouldShowCellCaption(ids.length,Boolean(maximized))?<CellCaption index={i+1} symbol={c.symbol} timeframe={c.timeframe} mode={mode} onActivate={()=>setW(v=>({...v,active:id}))} onMaximize={()=>setMaximized(id)}/>:null}
     <ChartCell config={c} mode={mode} asOf={mode==='replay'?w.asOf:0} version={version} active={activeId===id&&!studyEdit&&!settings} drawingRailHost={drawingRailHost} bus={bus} reset={reset} drawings={drawings} onDrawings={(key,d)=>setDrawings(v=>({...v,[key]:d}))} onStudy={(t,v)=>changeStudy(id,t,v)} onEdit={type=>setStudyEdit({cell:id,type})} onRemove={type=>patchCell(id,{indicators:c.indicators.filter(t=>t!==type)})} onStatus={s=>setStatuses(v=>({...v,[id]:s}))} magnet={magnet} held={held} stay={stay} onMagnet={()=>setMagnet(m=>m==='none'?'weak':'none')} onStay={()=>setStay(v=>!v)}/>
    </section>}):<div className="compare-message" role="status">{error||'Loading local workspace…'}</div>}
    {!maximized&&['columns','three','four'].includes(w.layout)?divider('column'):null}{!maximized&&['rows','three','four'].includes(w.layout)?divider('row'):null}
   </div>
   {sidebar?<aside className="workspace-watchlist"><header><h2>Watchlist</h2><span>{mode==='live'?'Live':'Replay snapshot'}</span></header><div className="watchlist-head"><span>Symbol</span><span>Last</span></div>{(['BTCUSDT','ETHUSDT','SOLUSDT'] as const).map(symbol=>{const c=current.cells.find(c=>ids.includes(c.id)&&c.symbol===symbol),p=c?statuses[c.id]?.close:null;return <button key={symbol} aria-pressed={active.symbol===symbol} onClick={()=>patchCell(activeId,{symbol})}><span className={`coin-icon ${symbol}`}>{symbol==='BTCUSDT'?'₿':symbol==='ETHUSDT'?'Ξ':'◎'}</span><strong>{symbol}</strong><span>{p?.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:symbol==='SOLUSDT'?3:2})??'—'}</span></button>})}<p>Prices from visible charts.<br/>Click a symbol to change the active chart.</p></aside>:null}
   <WorkspaceUtilityRail watchlistOpen={sidebar} layoutOpen={layoutOpen} onToggleWatchlist={()=>setSidebar(v=>!v)} onToggleLayout={()=>{setLayoutOpen(v=>!v);setIndicatorsOpen(false)}} onOpenSettings={()=>setSettings(true)} onExport={exportWorkspace}/>
  </main>
  {mode==='replay'
   ?<ReplayTransport asOf={w.asOf} available={available} playing={playing} ready={allReady} speed={speed} timeframe={active.timeframe} onSeek={seek} onTogglePlaying={()=>setPlaying(v=>!v)} onStep={step} onSpeed={setSpeed}/>
   :<LiveTransport health={statuses[activeId]?.health??'connecting'} updated={statuses[activeId]?.updated??null}/>
  }
  <WorkspaceStatusBar mode={mode} chartCount={ids.length} held={held} magnet={magnet} stay={stay} storageError={storageError} utcContext={mode==='replay'?`${new Date(w.asOf).toISOString().slice(0,16).replace('T',' ')} UTC`:''} onMagnetChange={setMagnet}/>
  <PreviewSettings open={settings} onClose={()=>setSettings(false)}/>
  {studyEdit&&edited?<StudySettingsDialog key={studyEdit.cell+studyEdit.type} type={studyEdit.type} value={normalizeStudy(studyEdit.type,edited.studies[studyEdit.type]??defaultStudy(studyEdit.type))} onSave={s=>changeStudy(edited.id,studyEdit.type,s)} onClose={()=>setStudyEdit(null)}/>:null}
 </div></OpenChartsProvider>
}
function PreviewSettings({open,onClose}:{open:boolean;onClose:()=>void}){const prefs=useChartPreferences();return <ChartSettingsDialog open={open} onClose={onClose} prefs={prefs} isDark activePlugins={[]} hasAccount={false} onOpenNewsConfig={onClose}/>}
