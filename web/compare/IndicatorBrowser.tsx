import {useEffect,useRef,useState,type RefObject, type ReactElement} from 'react'
import {ActivityLogIcon,BarChartIcon,CheckIcon,Cross2Icon,GearIcon,LayersIcon,MagnifyingGlassIcon} from '@radix-ui/react-icons'
import type {IndicatorType} from '@dylanpersonguy/opencharts'
import type {Symbol,Timeframe} from '../replay'

type Category='all'|'overlays'|'oscillators'
type IndicatorDefinition={type:IndicatorType;name:string;category:Exclude<Category,'all'>;placement:'Price overlay'|'Separate pane'}

const catalog:IndicatorDefinition[]=[
 {type:'SMA',name:'Simple moving average',category:'overlays',placement:'Price overlay'},
 {type:'EMA',name:'Exponential moving average',category:'overlays',placement:'Price overlay'},
 {type:'BOLL',name:'Bollinger Bands',category:'overlays',placement:'Price overlay'},
 {type:'VWAP',name:'Volume-weighted average price',category:'overlays',placement:'Price overlay'},
 {type:'RSI',name:'Relative strength index',category:'oscillators',placement:'Separate pane'},
 {type:'MACD',name:'Moving average convergence/divergence',category:'oscillators',placement:'Separate pane'},
 {type:'ATR',name:'Average true range',category:'oscillators',placement:'Separate pane'},
 {type:'STOCH',name:'Stochastic',category:'oscillators',placement:'Separate pane'},
]

const categoryLabels:Record<Category,string>={all:'All supported',overlays:'Price overlays',oscillators:'Oscillators'}

export function filterIndicatorTypes(query:string,category:Category='all'):IndicatorType[]{
 const terms=query.trim().toLowerCase().split(/\s+/).filter(Boolean)
 return catalog.filter(item=>{
  if(category!=='all'&&item.category!==category)return false
  const searchable=`${item.type} ${item.name} ${item.placement}`.toLowerCase()
  return terms.every(term=>searchable.includes(term))
 }).map(item=>item.type)
}

export function IndicatorBrowser({
 open,symbol,timeframe,active,triggerRef,onClose,onToggle,onEdit,
}:{
 open:boolean
 symbol:Symbol
 timeframe:Timeframe
 active:IndicatorType[]
 triggerRef:RefObject<HTMLButtonElement|null>
 onClose:()=>void
 onToggle:(type:IndicatorType)=>void
 onEdit:(type:IndicatorType)=>void
}):ReactElement{
 const dialog=useRef<HTMLDialogElement>(null)
 const search=useRef<HTMLInputElement>(null)
 const [query,setQuery]=useState('')
 const [category,setCategory]=useState<Category>('all')
 const visible=filterIndicatorTypes(query,category)
 useEffect(()=>{
  const element=dialog.current
  if(!element)return
  if(open&&!element.open){
   setQuery('')
   setCategory('all')
   element.showModal()
   search.current?.focus()
  }else if(!open&&element.open)element.close()
 },[open])
 const close=()=>onClose()
 return <dialog ref={dialog} className="indicator-browser-dialog" aria-labelledby="indicator-browser-title" onCancel={event=>{event.preventDefault();close()}} onClose={()=>triggerRef.current?.focus()} onClick={event=>{
  if(event.target!==event.currentTarget)return
  const bounds=event.currentTarget.getBoundingClientRect()
  if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)close()
 }}>
  <header className="indicator-browser-heading">
   <h2 id="indicator-browser-title">Indicators, metrics, and strategies</h2>
   <button type="button" aria-label="Close indicator browser" title="Close" onClick={close}><Cross2Icon aria-hidden="true"/></button>
  </header>
  <label className="indicator-browser-search">
   <MagnifyingGlassIcon aria-hidden="true"/>
   <span className="sr-only">Search supported indicators</span>
   <input ref={search} type="search" autoComplete="off" placeholder="Search" value={query} onChange={event=>setQuery(event.target.value)}/>
  </label>
  <div className="indicator-browser-content">
   <nav className="indicator-browser-categories" aria-label="Indicator categories">
    <h3>SUPPORTED</h3>
    {(['all','overlays','oscillators'] as const).map(item=>{
     const Icon=item==='all'?BarChartIcon:item==='overlays'?LayersIcon:ActivityLogIcon
     const count=filterIndicatorTypes('',item).length
     return <button key={item} type="button" aria-pressed={category===item} onClick={()=>setCategory(item)}>
      <Icon aria-hidden="true"/><span>{categoryLabels[item]}</span><small>{count}</small>
     </button>
    })}
   </nav>
   <section className="indicator-browser-list" aria-label={`${categoryLabels[category]} for ${symbol} ${timeframe}`}>
   <div className="indicator-browser-list-heading">
    <span className="indicator-browser-code-spacer" aria-hidden="true"/>
    <span>NAME</span>
    <span className="indicator-browser-heading-placement">PLACEMENT</span>
    <span aria-hidden="true"/>
    <span aria-hidden="true"/>
   </div>
   <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {visible.length?`${visible.length} ${visible.length===1?'indicator':'indicators'} found`:'No supported indicators found'}
   </div>
    <div className="indicator-browser-rows" role="list" aria-label="Supported indicators">
     {visible.length?visible.map(type=>{
      const item=catalog.find(definition=>definition.type===type)!
      const isActive=active.includes(type)
      return <div className={`indicator-browser-row${isActive?' is-active':''}`} role="listitem" key={type}>
       <button type="button" className="indicator-browser-row-main" aria-pressed={isActive} aria-label={`${isActive?'Remove':'Add'} ${item.name} · ${item.placement}`} onClick={()=>onToggle(type)}>
        <span className="indicator-browser-code">{item.type}</span>
        <span className="indicator-browser-name"><strong>{item.name}</strong></span>
        <span className="indicator-browser-type">{item.placement}</span>
        <span className="indicator-browser-row-state" aria-hidden="true">{isActive?<CheckIcon/>:'+'}</span>
       </button>
       {isActive?<button type="button" className="indicator-browser-settings" aria-label={`${item.name} input and style settings`} title={`${item.name} input and style settings`} onClick={()=>onEdit(type)}><GearIcon aria-hidden="true"/></button>:null}
      </div>
     }):<p className="indicator-browser-empty">No supported indicators found</p>}
    </div>
   </section>
  </div>
 </dialog>
}
