import {useEffect,useRef,useState,type FormEvent,type ReactElement} from 'react'
import {
 BarChartIcon,
 CheckIcon,
 ChevronDownIcon,
 DashboardIcon,
 DownloadIcon,
 EnterFullScreenIcon,
 ExitFullScreenIcon,
 GearIcon,
 PauseIcon,
 PlayIcon,
 RowsIcon,
 TrackNextIcon,
} from '@radix-ui/react-icons'
import type {Symbol,Timeframe} from '../replay'
import type {CellStatus,DrawingStore} from './ChartCell'
import type {Magnet} from './studies'
import type {CellConfig,Workspace} from './workspace'

export type WorkspaceBackup={
 workspace:Workspace
 liveWorkspace:CellConfig[]
 drawings:DrawingStore
 magnet:Magnet
 stay:boolean
}
export type WorkspaceBackupPayload=WorkspaceBackup

export function activeDrawingRailHost(active:boolean,host:HTMLDivElement|null):HTMLDivElement|null{
 return active?host:null
}

export function WorkspaceDrawingRailHost({setHost}:{setHost:(host:HTMLDivElement|null)=>void}):ReactElement{
 return <aside ref={setHost} className="drawing-rail-host" aria-label="Drawing tools"/>
}

export function shouldShowCellCaption(visibleCount:number,maximized:boolean):boolean{
 return visibleCount>1&&!maximized
}

export function createWorkspaceBackup(input:WorkspaceBackup):WorkspaceBackupPayload{
 return {
  workspace:input.workspace,
  liveWorkspace:input.liveWorkspace,
  drawings:input.drawings,
  magnet:input.magnet,
  stay:input.stay,
 }
}

export type CellCaptionProps={
 index:number
 symbol:Symbol
 timeframe:Timeframe
 mode:'replay'|'live'
 onActivate:()=>void
 onMaximize:()=>void
}

export function CellCaption({index,symbol,timeframe,mode,onActivate,onMaximize}:CellCaptionProps):ReactElement{
 return <div className="cell-caption">
  <button aria-label={`Activate chart ${index}`} onClick={onActivate}>{symbol}<span>{timeframe} · {mode==='live'?'LIVE':'REPLAY'}</span></button>
  <button aria-label={`Maximize chart ${index}`} title={`Maximize chart ${index}`} onClick={onMaximize}><EnterFullScreenIcon/></button>
 </div>
}

export function ActiveChartMaximizeButton({maximized,onToggle}:{maximized:boolean;onToggle:()=>void}):ReactElement{
 const label=maximized?'Restore chart layout':'Maximize active chart'
 return <button aria-label={label} title={label} onClick={onToggle}>{maximized?<ExitFullScreenIcon/>:<EnterFullScreenIcon/>}</button>
}

export function IndicatorToolbarButton({expanded,onToggle}:{expanded:boolean;onToggle:()=>void}):ReactElement{
 return <button className="toolbar-action alignment-control" aria-label="Indicators" title="Indicators" aria-expanded={expanded} onClick={onToggle}><BarChartIcon/>Indicators</button>
}

const PAIRS:Symbol[]=['BTCUSDT','ETHUSDT','SOLUSDT']

export function PairSelector({value,onChange}:{value:Symbol;onChange:(symbol:Symbol)=>void}):ReactElement{
 const [open,setOpen]=useState(false)
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);root.current?.querySelector<HTMLButtonElement>('.pair-selector-trigger')?.focus()}}
  window.addEventListener('pointerdown',close)
  window.addEventListener('keydown',escape)
  return()=>{window.removeEventListener('pointerdown',close);window.removeEventListener('keydown',escape)}
 },[open])
 return <div ref={root} className="pair-selector">
  <button className="pair-selector-trigger alignment-control" type="button" aria-label="Pair" aria-haspopup="menu" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <span className={`coin-icon ${value}`} aria-hidden="true">{value==='BTCUSDT'?'₿':value==='ETHUSDT'?'Ξ':'◎'}</span>
   <span>{value}</span><ChevronDownIcon aria-hidden="true"/>
  </button>
  {open?<div className="pair-selector-menu" role="menu" aria-label="Select pair">
   {PAIRS.map(symbol=><button key={symbol} type="button" role="menuitemradio" aria-checked={symbol===value} onClick={()=>{onChange(symbol);setOpen(false)}}>
    <span className={`coin-icon ${symbol}`} aria-hidden="true">{symbol==='BTCUSDT'?'₿':symbol==='ETHUSDT'?'Ξ':'◎'}</span><span>{symbol}</span>{symbol===value?<CheckIcon aria-hidden="true"/>:null}
   </button>)}
  </div>:null}
 </div>
}

export type WorkspaceUtilityRailProps={
 watchlistOpen:boolean
 layoutOpen:boolean
 onToggleWatchlist:()=>void
 onToggleLayout:()=>void
 onOpenSettings:()=>void
 onExport:()=>void
}

export function WorkspaceUtilityRail({watchlistOpen,layoutOpen,onToggleWatchlist,onToggleLayout,onOpenSettings,onExport}:WorkspaceUtilityRailProps):ReactElement{
 return <nav className="workspace-utility-rail" aria-label="Workspace utilities">
  <button className="alignment-icon-control" aria-label="Watchlist" title="Watchlist" aria-pressed={watchlistOpen} onClick={onToggleWatchlist}><RowsIcon/></button>
  <button className="alignment-icon-control" aria-label="Chart layout" title="Chart layout" aria-expanded={layoutOpen} onClick={onToggleLayout}><DashboardIcon/></button>
  <button className="alignment-icon-control" aria-label="Chart settings" title="Chart settings · workspace appearance" onClick={onOpenSettings}><GearIcon/></button>
  <button className="alignment-icon-control" aria-label="Export workspace backup" title="Export workspace backup" onClick={onExport}><DownloadIcon/></button>
 </nav>
}

export type ReplayTransportProps={
 asOf:number
 available?:{start:number;end:number}
 playing:boolean
 ready:boolean
 speed:number
 timeframe:Timeframe
 onSeek:(time:number)=>void
 onTogglePlaying:()=>void
 onStep:()=>void
 onSpeed:(speed:number)=>void
}

const stamp=(time:number)=>new Date(time).toISOString().slice(0,16)

export function ReplayTransport({asOf,available,playing,ready,speed,timeframe,onSeek,onTogglePlaying,onStep,onSpeed}:ReplayTransportProps):ReactElement{
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault()
  const value=new FormData(event.currentTarget).get('time')
  if(typeof value==='string')onSeek(Date.parse(value+'Z'))
 }
 return <div className="workspace-transport compare-replay">
  <form className="compare-seek" onSubmit={submit}>
   <label><span>Replay · UTC</span><input className="alignment-numeric-control" key={asOf} name="time" type="datetime-local" aria-label="Replay time · UTC" defaultValue={stamp(asOf)} min={available?stamp(available.start+60000):undefined} max={available?stamp(available.end):undefined} required/></label>
   <button type="submit">Go</button>
  </form>
  <button className="alignment-icon-control" aria-label={playing?'Pause replay':'Play replay'} title={playing?'Pause replay':'Play replay'} disabled={!ready&&!playing} onClick={onTogglePlaying}>{playing?<PauseIcon/>:<PlayIcon/>}</button>
  <button className="alignment-icon-control" aria-label="Next candle" title="Next candle" disabled={!ready} onClick={onStep}><TrackNextIcon/></button>
  <select className="alignment-numeric-control" aria-label="Replay speed" value={speed} onChange={event=>onSpeed(Number(event.target.value))}>{[.5,1,2,5,10].map(value=><option key={value} value={value}>{value}×</option>)}</select>
  <span>{playing?'Playing':'Paused'} · all charts · step {timeframe}</span>
 </div>
}

export type LiveTransportProps={health:CellStatus['health'];updated:number|null}

export function LiveTransport({health,updated}:LiveTransportProps):ReactElement{
 const label=health==='live'?'● Live · Binance USD-M':health==='stale'?'● Stale data · reconnecting':'● Connecting / syncing candles…'
 return <div className={`workspace-transport compare-live ${health}`}>
  <span>{label}</span>
  <span>{updated?`Updated ${new Date(updated).toISOString().slice(11,19)} UTC`:''}</span>
 </div>
}

export type WorkspaceStatusBarProps={
 mode:'replay'|'live'
 chartCount:number
 held:boolean
 magnet:Magnet
 stay:boolean
 storageError:string
 utcContext:string
 onMagnetChange:(magnet:Magnet)=>void
}

export function WorkspaceStatusBar({mode,chartCount,held,magnet,stay,storageError,utcContext,onMagnetChange}:WorkspaceStatusBarProps):ReactElement{
 const magnetLabel=held?'Magnet · Cmd/Ctrl held':magnet==='none'?'Hold Cmd/Ctrl to snap':`Magnet · ${magnet}`
 return <footer className="workspace-statusbar compare-footer">
  <span>{mode==='live'?'Live':'Replay'} · {chartCount} chart{chartCount>1?'s':''}</span>
  <span>{magnetLabel}{stay?' · Stay in drawing mode':''}</span>
  <select className="alignment-numeric-control" aria-label="Persistent magnet" value={magnet} onChange={event=>onMagnetChange(event.target.value as Magnet)}><option value="none">Magnet off</option><option value="weak">Weak magnet</option><option value="strong">Strong magnet</option></select>
  <span role="status">{storageError}</span>
  {utcContext?<time>{utcContext}</time>:null}
  <a href="https://github.com/dylanpersonguy/OpenCharts" target="_blank" rel="noreferrer">OpenCharts · MIT</a>
 </footer>
}
