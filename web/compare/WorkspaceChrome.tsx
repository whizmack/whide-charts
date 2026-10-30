import {useEffect,useRef,useState,type CSSProperties,type FormEvent,type KeyboardEvent as ReactKeyboardEvent,type ReactElement,type ReactNode,type Ref} from 'react'
import {createPortal} from 'react-dom'
import {
 BarChartIcon,
 CalendarIcon,
 ChevronLeftIcon,
 ChevronRightIcon,
 CheckIcon,
 Cross2Icon,
 ChevronDownIcon,
 DashboardIcon,
 DownloadIcon,
 EnterFullScreenIcon,
 ExitFullScreenIcon,
 GearIcon,
 InfoCircledIcon,
 MagnifyingGlassIcon,
 PauseIcon,
 PlayIcon,
 RowsIcon,
 TrackNextIcon,
} from '@radix-ui/react-icons'
import {TIMEFRAMES,type Symbol,type Timeframe} from '../replay'
import type {CellStatus,DrawingStore} from './ChartCell'
import type {Magnet} from './studies'
import {QUICK_RANGES,calendarMonth,quickRangeWindow,resolveDateRange,resolveGotoTime,type CellConfig,type QuickRange,type Workspace} from './workspace'
import type {ChartBus} from './chartBus'

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

export function IndicatorToolbarButton({expanded,onToggle,buttonRef}:{expanded:boolean;onToggle:()=>void;buttonRef?:Ref<HTMLButtonElement>}):ReactElement{
 return <button ref={buttonRef} className="toolbar-action alignment-control" aria-label="Indicators" title="Indicators" aria-expanded={expanded} onClick={onToggle}><BarChartIcon/>Indicators</button>
}

const PAIRS:Symbol[]=['BTCUSDT','ETHUSDT','SOLUSDT']
const PAIR_NAMES:Record<Symbol,string>={BTCUSDT:'Bitcoin / TetherUS',ETHUSDT:'Ethereum / TetherUS',SOLUSDT:'Solana / TetherUS'}

export function filterSupportedPairs(query:string):Symbol[]{
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean)
 if(!terms.length)return PAIRS
 return PAIRS.filter(symbol=>{
  const words=[symbol.toLowerCase(),...PAIR_NAMES[symbol].toLowerCase().split(/[^a-z0-9]+/),'binance','usd-m','perpetual']
  return terms.every(term=>symbol.toLowerCase().includes(term)||words.some(word=>word.startsWith(term)))
 })
}

export function PairSelector({value,onChange}:{value:Symbol;onChange:(symbol:Symbol)=>void}):ReactElement{
 const [open,setOpen]=useState(false)
 const [query,setQuery]=useState('')
 const [activeIndex,setActiveIndex]=useState(0)
 const dialog=useRef<HTMLDialogElement>(null)
 const trigger=useRef<HTMLButtonElement>(null)
 const search=useRef<HTMLInputElement>(null)
 const results=useRef<Array<HTMLButtonElement|null>>([])
 const filteredPairs=filterSupportedPairs(query)
 useEffect(()=>{
  const element=dialog.current
  if(!element)return
  if(open&&!element.open){element.showModal();search.current?.focus()}
  else if(!open&&element.open)element.close()
 },[open])
 function dismiss(){setOpen(false);setQuery('');setActiveIndex(0)}
 function choose(symbol:Symbol){onChange(symbol);dismiss()}
 function focusResult(index:number){
  const next=Math.max(0,Math.min(filteredPairs.length-1,index))
  setActiveIndex(next)
  results.current[next]?.focus()
 }
 return <div className="pair-selector">
  <button ref={trigger} className="pair-selector-trigger alignment-control" type="button" aria-label="Pair" aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setQuery('');setActiveIndex(0);setOpen(true)}}>
   <span className={`coin-icon ${value}`} aria-hidden="true">{value==='BTCUSDT'?'₿':value==='ETHUSDT'?'Ξ':'◎'}</span>
   <span>{value}</span><ChevronDownIcon aria-hidden="true"/>
  </button>
  <dialog ref={dialog} className="pair-selector-dialog" aria-labelledby="pair-search-title" onCancel={event=>{event.preventDefault();dismiss()}} onClose={()=>trigger.current?.focus()} onClick={event=>{
   if(event.target!==event.currentTarget)return
   const bounds=event.currentTarget.getBoundingClientRect()
   if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dismiss()
  }}>
   <h2 id="pair-search-title" className="sr-only">Symbol search</h2>
   <label className="pair-search-field">
    <MagnifyingGlassIcon aria-hidden="true"/>
    <span className="sr-only">Search supported symbols</span>
    <input ref={search} type="search" name="symbol-search" autoComplete="off" placeholder="Search symbols" value={query} onChange={event=>{setQuery(event.target.value);setActiveIndex(0)}} onKeyDown={event=>{
     if(event.key==='ArrowDown'&&filteredPairs.length){event.preventDefault();focusResult(activeIndex)}
     else if(event.key==='Enter'&&filteredPairs.length){event.preventDefault();choose(filteredPairs[activeIndex]??filteredPairs[0])}
    }}/>
   </label>
   <button className="pair-search-close" type="button" aria-label="Close symbol search" onClick={dismiss}><Cross2Icon aria-hidden="true"/></button>
   <section className="pair-search-results" aria-labelledby="pair-market-heading">
    <header><h3 id="pair-market-heading">BINANCE · USD-M</h3><span>PERPETUALS</span></header>
    <div className="pair-result-list" role="listbox" aria-label="Supported Binance USD-M perpetual pairs">
     {filteredPairs.length?filteredPairs.map((symbol,index)=><button ref={element=>{results.current[index]=element}} key={symbol} className="pair-result" type="button" role="option" aria-selected={symbol===value} tabIndex={index===activeIndex?0:-1} onClick={()=>choose(symbol)} onKeyDown={event=>{
      if(event.key==='ArrowDown'){event.preventDefault();focusResult((index+1)%filteredPairs.length)}
      else if(event.key==='ArrowUp'){event.preventDefault();focusResult((index+filteredPairs.length-1)%filteredPairs.length)}
      else if(event.key==='Home'){event.preventDefault();focusResult(0)}
      else if(event.key==='End'){event.preventDefault();focusResult(filteredPairs.length-1)}
     }}>
      <span className={`coin-icon ${symbol}`} aria-hidden="true">{symbol==='BTCUSDT'?'₿':symbol==='ETHUSDT'?'Ξ':'◎'}</span>
      <span className="pair-result-copy"><strong>{symbol}</strong><span>{PAIR_NAMES[symbol]}</span></span>
      <span className="pair-market-type">PERPETUAL</span>{symbol===value?<CheckIcon aria-hidden="true"/>:null}
     </button>):<p className="pair-search-empty" role="status">No supported symbols found</p>}
    </div>
   </section>
  </dialog>
 </div>
}

const timeframeGroups=[
 {label:'Minutes',values:TIMEFRAMES.filter(timeframe=>timeframe.endsWith('m'))},
 {label:'Hours',values:TIMEFRAMES.filter(timeframe=>timeframe.endsWith('h'))},
]

function timeframeLabel(timeframe:Timeframe):string{
 const unit=timeframe.endsWith('m')?'minute':'hour'
 const amount=Number.parseInt(timeframe,10)
 return `${amount} ${unit}${amount===1?'':'s'}`
}

export function TimeframeSelector({value,onChange}:{value:Timeframe;onChange:(timeframe:Timeframe)=>void}):ReactElement{
 const [open,setOpen]=useState(false)
 const [position,setPosition]=useState({left:0,top:0})
 const root=useRef<HTMLDivElement>(null)
 const trigger=useRef<HTMLButtonElement>(null)
 const menu=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  if(!open)return
  const close=(event:PointerEvent)=>{const target=event.target as Node;if(!root.current?.contains(target)&&!menu.current?.contains(target))setOpen(false)}
  window.addEventListener('pointerdown',close)
  return()=>window.removeEventListener('pointerdown',close)
 },[open])
 function focusMenuItem(edge:'selected'|'first'|'last'){
  const items=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')??[])
  const index=edge==='first'?0:edge==='last'?items.length-1:items.findIndex(item=>item.dataset.timeframe===value)
  items[index]?.focus()
 }
 function openMenu(edge:'selected'|'first'|'last'='selected'){
  const bounds=trigger.current?.getBoundingClientRect()
  const width=194,height=210
  if(bounds){
   const left=Math.max(6,Math.min(bounds.left,window.innerWidth-width-6))
   const below=bounds.bottom+4+height<=window.innerHeight-6
   setPosition({left,top:below?bounds.bottom+4:Math.max(6,bounds.top-height-4)})
  }
  setOpen(true)
  requestAnimationFrame(()=>focusMenuItem(edge))
 }
 function select(timeframe:Timeframe){onChange(timeframe);setOpen(false);trigger.current?.focus()}
 function navigateMenu(event:ReactKeyboardEvent<HTMLDivElement>){
  const items=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
  const index=items.indexOf(document.activeElement as HTMLButtonElement)
  if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();return}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Home'||event.key==='End'){
   event.preventDefault()
   const next=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?(index+1+items.length)%items.length:(index-1+items.length)%items.length
   items[next]?.focus()
  }
 }
 return <div ref={root} className="compare-timeframes" role="group" aria-label="Timeframe">
  {TIMEFRAMES.map(timeframe=><button key={timeframe} type="button" aria-pressed={value===timeframe} title={timeframeLabel(timeframe)} onClick={()=>{onChange(timeframe);setOpen(false)}}>{timeframe}</button>)}
  <div className="timeframe-selector">
   <button ref={trigger} className="timeframe-menu-trigger" type="button" aria-label="More timeframes" title="More timeframes" aria-haspopup="menu" aria-expanded={open} onClick={()=>open?setOpen(false):openMenu()} onKeyDown={event=>{
    if(event.key==='ArrowDown'){event.preventDefault();openMenu('first')}
    else if(event.key==='ArrowUp'){event.preventDefault();openMenu('last')}
    else if(event.key==='Escape'&&open){event.preventDefault();setOpen(false);trigger.current?.focus()}
   }}><ChevronDownIcon aria-hidden="true"/></button>
  </div>
  {open&&typeof document!=='undefined'?createPortal(<div ref={menu} className="timeframe-menu" role="menu" aria-label="Chart interval" style={position} onKeyDown={navigateMenu}>
   {timeframeGroups.map(group=><section className="timeframe-menu-group" role="group" aria-label={group.label} key={group.label}>
    <h2>{group.label}</h2>
    {group.values.map(timeframe=><button key={timeframe} data-timeframe={timeframe} type="button" role="menuitemradio" aria-checked={value===timeframe} tabIndex={value===timeframe?0:-1} onClick={()=>select(timeframe)}><span>{timeframeLabel(timeframe)}</span>{value===timeframe?<CheckIcon aria-hidden="true"/>:null}</button>)}
   </section>)}
  </div>,document.body):null}
 </div>
}

export type WorkspaceUtilityRailProps={
 watchlistOpen:boolean
 layoutOpen:boolean
 layoutButtonRef?:Ref<HTMLButtonElement>
 onToggleWatchlist:()=>void
 onToggleLayout:()=>void
 onOpenSettings:()=>void
 onOpenAbout:()=>void
 onExport:()=>void
}

export function menuFocusIndex(key:string,index:number,itemCount:number):number|null{
 if(itemCount<=0)return null
 if(key==='Home')return 0
 if(key==='End')return itemCount-1
 if(key==='ArrowDown')return(index+1+itemCount)%itemCount
 if(key==='ArrowUp')return(index-1+itemCount)%itemCount
 return null
}

export type WorkspaceSettingsMenuProps={
 open:boolean
 onOpenChartSettings:()=>void
 onOpenAbout:()=>void
 onClose?:()=>void
}

export function WorkspaceSettingsMenu({open,onOpenChartSettings,onOpenAbout,onClose=()=>{}}:WorkspaceSettingsMenuProps):ReactElement|null{
 if(!open)return null
 function handleKeyDown(event:ReactKeyboardEvent<HTMLDivElement>){
  if(event.key==='Escape'){event.preventDefault();onClose();return}
  const items=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
  const index=items.indexOf(document.activeElement as HTMLButtonElement)
  const next=menuFocusIndex(event.key,index,items.length)
  if(next!==null){event.preventDefault();items[next]?.focus()}
 }
 return <div className="workspace-settings-menu" role="menu" aria-label="Settings" onKeyDown={handleKeyDown}>
  <button type="button" role="menuitem" onClick={onOpenChartSettings}><GearIcon aria-hidden="true"/>Chart settings</button>
  <button type="button" role="menuitem" onClick={onOpenAbout}><InfoCircledIcon aria-hidden="true"/>About &amp; licenses</button>
 </div>
}

export function WorkspaceUtilityRail({watchlistOpen,layoutOpen,layoutButtonRef,onToggleWatchlist,onToggleLayout,onOpenSettings,onOpenAbout,onExport}:WorkspaceUtilityRailProps):ReactElement{
 const [settingsOpen,setSettingsOpen]=useState(false)
 const rail=useRef<HTMLElement>(null)
 const settingsButton=useRef<HTMLButtonElement>(null)
 useEffect(()=>{
  if(!settingsOpen)return
  const firstFrame=requestAnimationFrame(()=>rail.current?.querySelector<HTMLButtonElement>('.workspace-settings-menu [role="menuitem"]')?.focus())
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!rail.current?.contains(event.target))setSettingsOpen(false)}
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setSettingsOpen(false);settingsButton.current?.focus()}}
  document.addEventListener('pointerdown',outside)
  window.addEventListener('keydown',escape)
  return()=>{cancelAnimationFrame(firstFrame);document.removeEventListener('pointerdown',outside);window.removeEventListener('keydown',escape)}
 },[settingsOpen])
 function openChartSettings(){setSettingsOpen(false);settingsButton.current?.focus();onOpenSettings()}
 function openAbout(){setSettingsOpen(false);settingsButton.current?.focus();onOpenAbout()}
 return <nav ref={rail} className="workspace-utility-rail" aria-label="Workspace utilities">
  <button className="alignment-icon-control" aria-label="Watchlist" title="Watchlist" aria-pressed={watchlistOpen} onClick={onToggleWatchlist}><RowsIcon/></button>
  <button ref={layoutButtonRef} className="alignment-icon-control" aria-label="Chart layout" title="Chart layout" aria-expanded={layoutOpen} onClick={onToggleLayout}><DashboardIcon/></button>
  <button ref={settingsButton} className="alignment-icon-control" aria-label="Settings" title="Settings" aria-haspopup="menu" aria-expanded={settingsOpen} onClick={()=>setSettingsOpen(value=>!value)}><GearIcon/></button>
  <button className="alignment-icon-control" aria-label="Export workspace backup" title="Export workspace backup" onClick={onExport}><DownloadIcon/></button>
  <WorkspaceSettingsMenu open={settingsOpen} onOpenChartSettings={openChartSettings} onOpenAbout={openAbout} onClose={()=>{setSettingsOpen(false);settingsButton.current?.focus()}}/>
 </nav>
}

export type WorkspaceMagnetMenuProps={open:boolean;magnet:Magnet;onChange:(magnet:Magnet)=>void;onClose:()=>void}

const magnetChoices:{value:Magnet;label:string}[]=[{value:'none',label:'Off'},{value:'weak',label:'Weak'},{value:'strong',label:'Strong'}]

export function WorkspaceMagnetMenu({open,magnet,onChange,onClose}:WorkspaceMagnetMenuProps):ReactElement|null{
 const menu=useRef<HTMLDivElement>(null)
 const [position,setPosition]=useState<CSSProperties>({left:42,top:44})
 useEffect(()=>{
  if(!open)return
  const trigger=()=>document.querySelector<HTMLButtonElement>('.drawing-rail-host button[title^="Magnet"]')
  const updatePosition=()=>{
   const bounds=trigger()?.getBoundingClientRect()
   if(!bounds)return
   const width=172,height=112
   setPosition({left:Math.max(6,Math.min(bounds.right+4,window.innerWidth-width-6)),top:Math.max(6,Math.min(bounds.top,window.innerHeight-height-6))})
  }
  updatePosition()
  const frame=requestAnimationFrame(()=>menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus())
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!menu.current?.contains(event.target)&&!trigger()?.contains(event.target))onClose()}
  document.addEventListener('pointerdown',outside)
  window.addEventListener('resize',updatePosition)
  window.addEventListener('scroll',updatePosition,true)
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',updatePosition);window.removeEventListener('scroll',updatePosition,true)}
 },[open,onClose])
 if(!open)return null
 function focusTrigger(){document.querySelector<HTMLButtonElement>('.drawing-rail-host button[title^="Magnet"]')?.focus()}
 function handleKeyDown(event:ReactKeyboardEvent<HTMLDivElement>){
  if(event.key==='Escape'){event.preventDefault();focusTrigger();onClose();return}
  const items=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'))
  const index=items.indexOf(document.activeElement as HTMLButtonElement)
  const next=menuFocusIndex(event.key,index,items.length)
  if(next!==null){event.preventDefault();items[next]?.focus()}
 }
 const content=<div ref={menu} className="workspace-magnet-menu" role="menu" aria-label="Magnet mode" style={position} onKeyDown={handleKeyDown}>
  {magnetChoices.map(choice=><button key={choice.value} type="button" role="menuitemradio" aria-checked={magnet===choice.value} tabIndex={magnet===choice.value?0:-1} onClick={()=>{onChange(choice.value);focusTrigger();onClose()}}>{choice.label}{magnet===choice.value?<CheckIcon aria-hidden="true"/>:null}</button>)}
 </div>
 return typeof document==='undefined'?content:createPortal(content,document.body)
}

export function WorkspaceAboutDialog({open,onClose}:{open:boolean;onClose:()=>void}):ReactElement|null{
 const dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{
  const element=dialog.current
  if(!element)return
  if(open&&!element.open)element.showModal()
  else if(!open&&element.open)element.close()
  return()=>{if(element.open)element.close()}
 },[open])
 if(!open)return null
 return <dialog ref={dialog} className="workspace-about-dialog" aria-labelledby="workspace-about-title" onCancel={event=>{event.preventDefault();onClose()}} onClick={event=>{
  if(event.target!==event.currentTarget)return
  const bounds=event.currentTarget.getBoundingClientRect()
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)onClose()
 }}>
  <header><h2 id="workspace-about-title">About &amp; licenses</h2><button type="button" aria-label="Close About &amp; licenses" onClick={onClose}><Cross2Icon aria-hidden="true"/></button></header>
  <section>
   <p><a href="https://github.com/dylanpersonguy/OpenCharts" target="_blank" rel="noreferrer">OpenCharts · MIT</a><span>Chart workspace library</span></p>
   <p><a href="https://github.com/tradingview/lightweight-charts/blob/master/LICENSE" target="_blank" rel="noreferrer">Lightweight Charts · Apache 2.0</a><span>Chart rendering engine</span></p>
  </section>
  <footer><button type="button" onClick={onClose}>Done</button></footer>
 </dialog>
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

export type WorkspaceRangeToolbarProps={
 cell:string
 timeframe:Timeframe
 mode:'replay'|'live'
 asOf:number
 bus:ChartBus
 children?:ReactNode
}

export function WorkspaceRangeToolbar({cell,timeframe,mode,asOf,bus,children}:WorkspaceRangeToolbarProps):ReactElement{
 const dialog=useRef<HTMLDialogElement>(null),gotoButton=useRef<HTMLButtonElement>(null),[error,setError]=useState('')
 const [clock,setClock]=useState(()=>new Date())
 const bounds=bus.timeBounds(cell),defaultTime=mode==='replay'&&asOf?asOf:bounds?.end??Date.now()
 const dateValue=(time:number)=>new Date(time).toISOString().slice(0,10)
 const monthValue=(time:number)=>{const date=new Date(time);return {year:date.getUTCFullYear(),month:date.getUTCMonth()}}
 const [gotoOpen,setGotoOpen]=useState(false),[tab,setTab]=useState<'date'|'range'>('date')
 const [date,setDate]=useState(()=>dateValue(defaultTime)),[time,setTime]=useState(()=>new Date(defaultTime).toISOString().slice(11,16))
 const [fromDate,setFromDate]=useState(()=>dateValue(bounds?.start??defaultTime)),[toDate,setToDate]=useState(()=>dateValue(bounds?.end??defaultTime))
 const [endpoint,setEndpoint]=useState<'from'|'to'>('from'),[month,setMonth]=useState(()=>monthValue(defaultTime))
 const minDate=bounds?dateValue(bounds.start):'',maxDate=bounds?dateValue(bounds.end):''
 const calendar=bounds?calendarMonth(month.year,month.month,bounds.start,bounds.end):null
 useEffect(()=>{
  const timer=window.setInterval(()=>setClock(new Date()),1000)
  return()=>window.clearInterval(timer)
 },[])
 useEffect(()=>{const element=dialog.current;if(gotoOpen&&element&&!element.open){element.showModal();element.querySelector<HTMLInputElement>('input')?.focus()}},[gotoOpen])
 function openGoto(){
  if(!bounds)return
  const selected=Math.min(bounds.end,Math.max(bounds.start,defaultTime))
  setDate(dateValue(selected));setTime(new Date(selected).toISOString().slice(11,16))
  setFromDate(minDate);setToDate(maxDate);setEndpoint('from');setMonth(monthValue(selected));setTab('date');setError('');setGotoOpen(true)
 }
 function closeGoto(){
  setGotoOpen(false);setError('')
  if(dialog.current?.open)dialog.current.close()
  window.requestAnimationFrame(()=>gotoButton.current?.focus())
 }
 function shiftMonth(amount:number){
  setMonth(current=>{const next=new Date(Date.UTC(current.year,current.month+amount,1));return {year:next.getUTCFullYear(),month:next.getUTCMonth()}})
 }
 function pickDate(value:string){
  const selected=new Date(`${value}T00:00:00Z`)
  if(!Number.isFinite(selected.getTime()))return
  if(tab==='date')setDate(value)
  else if(endpoint==='from'){setFromDate(value);setEndpoint('to')}
  else setToDate(value)
  setMonth({year:selected.getUTCFullYear(),month:selected.getUTCMonth()})
 }
 function selectRange(range:QuickRange){
  if(!bounds)return
  const window=quickRangeWindow(range,bounds.start,bounds.last,timeframe)
  if(window)bus.setVisibleTimeRange(cell,window)
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('')
  if(!bounds){setError('Chart data is not available.');return}
  if(tab==='date'){
   const target=resolveGotoTime(date,time,bounds)
   if(target===null||!bus.centerOnTime(cell,target)){setError('Choose a date and time within the loaded chart data.');return}
  }else{
   const range=resolveDateRange(fromDate,toDate,bounds)
   if(!range||!bus.setVisibleTimeRange(cell,range)){setError('Choose a valid range within the loaded chart data.');return}
  }
  closeGoto()
 }
 return <div className="workspace-range-toolbar">
  <nav className="workspace-range-presets" aria-label="Chart date ranges">
   {QUICK_RANGES.map(range=><button key={range} type="button" aria-label={`${range} chart range`} title={`Show ${range}`} disabled={!bounds} onClick={()=>selectRange(range)}>{range}</button>)}
   <button ref={gotoButton} type="button" className="workspace-range-goto" aria-label="Go to date and time" title="Go to date and time" disabled={!bounds} onClick={openGoto}><CalendarIcon aria-hidden="true"/><span className="sr-only">Go to date and time</span></button>
  </nav>
  <div className="workspace-range-meta">
   {children}
   <time className="workspace-range-clock" dateTime={clock.toISOString()} aria-label="Current UTC time" title="UTC">{clock.toLocaleTimeString('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'})} UTC</time>
  </div>
  <dialog ref={dialog} className="workspace-goto-dialog" aria-label="Go to" onCancel={event=>{event.preventDefault();closeGoto()}} onClose={()=>{setGotoOpen(false);setError('')}} onClick={event=>{if(event.target===event.currentTarget)closeGoto()}}>
   <header className="workspace-goto-header"><h2>Go to</h2><button type="button" aria-label="Close Go to" onClick={closeGoto}><Cross2Icon/></button></header>
   <div className="workspace-goto-tabs" role="tablist" aria-label="Go to options">
    <button type="button" role="tab" aria-selected={tab==='date'} onClick={()=>setTab('date')}>Date</button>
    <button type="button" role="tab" aria-selected={tab==='range'} onClick={()=>setTab('range')}>Custom range</button>
   </div>
   <form className="workspace-goto-form" onSubmit={submit}>
    {tab==='date'?<div className="workspace-goto-fields date-fields">
     <label>Date<input name="goto-date" aria-label="Go to date and time · UTC" type="date" value={date} min={minDate} max={maxDate} onChange={event=>{setDate(event.target.value);const selected=new Date(`${event.target.value}T00:00:00Z`);if(Number.isFinite(selected.getTime()))setMonth({year:selected.getUTCFullYear(),month:selected.getUTCMonth()})}} required/></label>
     <label>Time<input name="goto-time" aria-label="Go to time · UTC" type="time" value={time} onChange={event=>setTime(event.target.value)} required/></label>
    </div>:<div className="workspace-goto-fields range-fields">
     <label>From<input name="from-date" aria-label="From date · UTC" type="date" value={fromDate} min={minDate} max={maxDate} onFocus={()=>setEndpoint('from')} onChange={event=>{setEndpoint('from');setFromDate(event.target.value)}} required/></label>
     <label>To<input name="to-date" aria-label="To date · UTC" type="date" value={toDate} min={minDate} max={maxDate} onFocus={()=>setEndpoint('to')} onChange={event=>{setEndpoint('to');setToDate(event.target.value)}} required/></label>
    </div>}
    <section className="workspace-goto-calendar" aria-label="Go to calendar">
     <div className="workspace-goto-month">
      <button type="button" aria-label="Previous month" disabled={!bounds||Date.UTC(month.year,month.month,0,23,59,59)<bounds.start} onClick={()=>shiftMonth(-1)}><ChevronLeftIcon/></button>
      <h3 aria-live="polite">{calendar?.label??'Calendar'}</h3>
      <button type="button" aria-label="Next month" disabled={!bounds||Date.UTC(month.year,month.month+1,1)>bounds.end} onClick={()=>shiftMonth(1)}><ChevronRightIcon/></button>
     </div>
     <div className="workspace-goto-weekdays" aria-hidden="true">{['Mo','Tu','We','Th','Fr','Sa','Su'].map(day=><span key={day}>{day}</span>)}</div>
     <div className="workspace-goto-days" role="grid" aria-label={calendar?.label??'Go to calendar'}>
      {calendar?.days.map((day,index)=>{
       if(!day)return <span key={`empty-${index}`} aria-hidden="true"/>
       const selected=tab==='date'?date===day.date:fromDate===day.date||toDate===day.date
       const inRange=tab==='range'&&fromDate<=day.date&&day.date<=toDate
       return <button key={day.date} type="button" role="gridcell" aria-label={day.date} aria-selected={selected} data-in-range={inRange||undefined} disabled={day.disabled} onClick={()=>pickDate(day.date)}>{day.day}</button>
      })}
     </div>
    </section>
    {error?<p className="workspace-goto-error" role="status">{error}</p>:null}
    <footer className="workspace-goto-actions"><button type="button" onClick={closeGoto}>Cancel</button><button className="primary" type="submit">Go to</button></footer>
   </form>
  </dialog>
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
