import {useEffect,useLayoutEffect,useMemo,useRef,useState,type KeyboardEvent as ReactKeyboardEvent,type ReactElement} from 'react'
import {createPortal} from 'react-dom'
import {updateChartPreferences,type ChartPreferences,type PriceScaleModePreference,type TimeScaleDateFormat,type TimeScaleTimeFormat} from '@dylanpersonguy/opencharts'
import {ChevronRightIcon,GearIcon,ResetIcon} from '@radix-ui/react-icons'
import type {IChartApi} from 'lightweight-charts'

export type AxisMenuKind='price'|'time'
export type AxisMenuState={id:number;kind:AxisMenuKind;x:number;y:number;returnFocus:HTMLElement|null}
type Submenu='time-zone'|'labels'|'lines'
type TimeZoneOption={value:string;label:string;offset:number}

const modes:{value:PriceScaleModePreference;label:string}[]=[
 {value:'normal',label:'Regular'},
 {value:'percentage',label:'Percent'},
 {value:'indexedTo100',label:'Indexed to 100'},
 {value:'logarithmic',label:'Logarithmic'},
]
const dates:{value:TimeScaleDateFormat;label:string}[]=[
 {value:'locale',label:'Automatic'},
 {value:'yyyy-MM-dd',label:'YYYY-MM-DD'},
 {value:'dd MMM yyyy',label:'DD MMM YYYY'},
 {value:'MMM dd, yyyy',label:'MMM DD, YYYY'},
]
const times:{value:TimeScaleTimeFormat;label:string}[]=[
 {value:'24-hour',label:'24-hour'},
 {value:'12-hour',label:'12-hour'},
]
const fallbackZones=['Etc/UTC','Europe/Prague','America/New_York','America/Los_Angeles','Asia/Tokyo']
const commonTimeZones=[
 'Pacific/Honolulu','America/Anchorage','America/Juneau','America/Los_Angeles','America/Phoenix','America/Vancouver',
 'America/Denver','America/Mexico_City','America/El_Salvador','America/Bogota','America/Chicago','America/Lima',
 'America/Caracas','America/New_York','America/Toronto','America/Argentina/Buenos_Aires','America/Halifax',
 'America/Santiago','America/Sao_Paulo','Atlantic/Azores','Europe/Dublin','Europe/Lisbon','Europe/London',
 'Atlantic/Reykjavik','Europe/Amsterdam','Europe/Belgrade','Europe/Berlin','Europe/Bratislava','Europe/Brussels',
 'Europe/Budapest','Africa/Casablanca','Europe/Copenhagen','Africa/Lagos','Europe/Ljubljana','Europe/Luxembourg',
 'Europe/Madrid','Europe/Malta','Europe/Oslo','Europe/Paris','Europe/Prague','Europe/Rome','Europe/Stockholm',
 'Africa/Tunis','Europe/Vienna','Europe/Warsaw','Europe/Zagreb','Europe/Zurich','Europe/Athens','Europe/Bucharest',
 'Europe/Helsinki','Asia/Jerusalem','Africa/Johannesburg','Asia/Nicosia','Europe/Riga','Europe/Sofia',
 'Europe/Tallinn','Europe/Vilnius','Asia/Bahrain','Africa/Cairo','Europe/Istanbul','Asia/Kuwait','Europe/Moscow',
 'Africa/Nairobi','Asia/Qatar','Asia/Riyadh','Asia/Tehran','Asia/Dubai','Asia/Muscat','Asia/Kabul',
 'Asia/Ashgabat','Asia/Almaty','Asia/Karachi','Asia/Colombo','Asia/Kolkata','Asia/Kathmandu','Asia/Dhaka',
 'Asia/Yangon','Asia/Bangkok','Asia/Ho_Chi_Minh','Asia/Jakarta','Asia/Chongqing','Asia/Shanghai','Asia/Hong_Kong',
 'Asia/Kuala_Lumpur','Asia/Manila','Australia/Perth','Asia/Singapore','Asia/Taipei','Asia/Seoul','Asia/Tokyo',
 'Australia/Brisbane','Australia/Adelaide','Australia/Sydney','Pacific/Norfolk','Pacific/Auckland','Pacific/Fakaofo',
 'Pacific/Chatham',
]
let cachedTimeZones:TimeZoneOption[]|undefined
const timeZoneCityNames:Record<string,string>={
 'America/El_Salvador':'San Salvador','Asia/Almaty':'Astana','Pacific/Norfolk':'Norfolk Island',
 'Pacific/Auckland':'New Zealand','Pacific/Fakaofo':'Tokelau','Pacific/Chatham':'Chatham Islands',
}

function timeZoneOptions():TimeZoneOption[]{
 if(cachedTimeZones)return cachedTimeZones
 const values=commonTimeZones.filter(zone=>{
  try{new Intl.DateTimeFormat('en-US',{timeZone:zone});return true}catch{return false}
 })
 const now=new Date()
 const options=values.map(value=>{
  const name=new Intl.DateTimeFormat('en-US',{timeZone:value,timeZoneName:'shortOffset'}).formatToParts(now).find(part=>part.type==='timeZoneName')?.value??'GMT'
  const match=/^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?)?$/.exec(name)
  const offset=match?(match[1]==='-'?-1:1)*((Number(match[2]??0)*60)+Number(match[3]??0)):0
  const city=timeZoneCityNames[value]??value.split('/').at(-1)?.replaceAll('_',' ')??value
  const label=`(${name.replace(/^GMT/, 'UTC')}) ${city}`
  return {value,label,offset}
 }).sort((a,b)=>a.offset-b.offset||a.label.localeCompare(b.label))
 cachedTimeZones=[{value:'Etc/UTC',label:'UTC',offset:0},...options]
 return cachedTimeZones
}

export function AxisContextMenu({menu,chart,prefs,onOpenSettings,onClose}:{menu:AxisMenuState;chart:IChartApi;prefs:ChartPreferences;onOpenSettings:()=>void;onClose:(restoreFocus:boolean)=>void}):ReactElement{
 const root=useRef<HTMLDivElement>(null),submenuRoot=useRef<HTMLDivElement>(null),submenuTrigger=useRef<HTMLButtonElement>(null)
 const [position,setPosition]=useState({left:menu.x,top:menu.y})
 const [submenu,setSubmenu]=useState<Submenu|null>(null)
 const [submenuPosition,setSubmenuPosition]=useState({left:0,top:0})
 const zones=useMemo(()=>{
  const options=timeZoneOptions()
  return options.some(option=>option.value===prefs.displayTimezone)?options:[{value:prefs.displayTimezone,label:prefs.displayTimezone,offset:0},...options]
 },[prefs.displayTimezone])
 useLayoutEffect(()=>{
  const node=root.current
  if(!node)return
  const rect=node.getBoundingClientRect(),gap=6
  setPosition({left:Math.max(gap,Math.min(menu.x,window.innerWidth-rect.width-gap)),top:Math.max(gap,Math.min(menu.y,window.innerHeight-rect.height-gap))})
  requestAnimationFrame(()=>node.querySelector<HTMLButtonElement>('[role^="menuitem"]')?.focus({preventScroll:true}))
 },[menu])
 useEffect(()=>{
  const outside=(event:PointerEvent)=>{
   const target=event.target as Node
   if(root.current?.contains(target)||submenuRoot.current?.contains(target))return
   onClose(false)
  }
  window.addEventListener('pointerdown',outside,true)
  return()=>window.removeEventListener('pointerdown',outside,true)
 },[onClose])
 function closeSubmenu(restoreFocus:boolean){
  setSubmenu(null)
  if(restoreFocus)requestAnimationFrame(()=>submenuTrigger.current?.focus({preventScroll:true}))
 }
 function openSubmenu(kind:Submenu,target:HTMLElement){
  submenuTrigger.current=target as HTMLButtonElement
  const rect=target.getBoundingClientRect(),width=kind==='time-zone'?264:224
  const sideRight=rect.right+width+4<=window.innerWidth-6
  const height=kind==='time-zone'?window.innerHeight-12:240
  const top=kind==='time-zone'?6:Math.max(6,Math.min(rect.top,window.innerHeight-height-6))
  setSubmenuPosition({left:sideRight?rect.right+4:Math.max(6,rect.left-width-4),top})
  setSubmenu(kind)
 }
 function keydown(event:ReactKeyboardEvent<HTMLDivElement>){
  const activeMenu=(event.target as HTMLElement).closest<HTMLElement>('[role="menu"]')
  const items=Array.from(activeMenu?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]')??[]).filter(item=>item.closest('[role="menu"]')===activeMenu)
  const index=items.indexOf(document.activeElement as HTMLButtonElement)
  if(event.key==='Escape'){
   event.preventDefault();event.stopPropagation()
   if(submenu&&activeMenu===submenuRoot.current){closeSubmenu(true);return}
   onClose(true);return
  }
  if(event.key==='ArrowRight'&&event.target instanceof HTMLButtonElement&&event.target.dataset.axisMenuTrigger){
   event.preventDefault();event.stopPropagation()
   openSubmenu(event.target.dataset.axisMenuTrigger as Submenu,event.target);requestAnimationFrame(()=>submenuRoot.current?.querySelector<HTMLButtonElement>('[role^="menuitem"]')?.focus({preventScroll:true}));return
  }
  if(event.key==='ArrowLeft'&&submenu&&activeMenu===submenuRoot.current){event.preventDefault();event.stopPropagation();closeSubmenu(true);return}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'||event.key==='Home'||event.key==='End'){
   event.preventDefault();event.stopPropagation()
   const next=event.key==='Home'?0:event.key==='End'?items.length-1:event.key==='ArrowDown'?(index+1+items.length)%items.length:(index-1+items.length)%items.length
   items[next]?.focus()
  }
 }
 function change(patch:Partial<ChartPreferences>){updateChartPreferences(patch);onClose(true)}
 function activate(action:()=>void){action();onClose(true)}
 function choice(label:string,checked:boolean,onSelect:()=>void){return <button key={label} type="button" role="menuitemradio" aria-checked={checked} onClick={onSelect}><span className="axis-menu-check" aria-hidden="true">{checked?'✓':''}</span><span className="axis-menu-label">{label}</span></button>}
 function toggle(label:string,checked:boolean,key:'showPriceScale'|'showLastValue'|'showPriceLine'|'priceScaleInverted'){
  return <button key={label} type="button" role="menuitemcheckbox" aria-checked={checked} onClick={()=>change({[key]:!checked})}><span className="axis-menu-check" aria-hidden="true">{checked?'✓':''}</span><span className="axis-menu-label">{label}</span></button>
 }
 function submenuTriggerButton(label:string,kind:Submenu){
  return <button ref={submenu===kind?submenuTrigger:undefined} type="button" role="menuitem" aria-haspopup="menu" aria-expanded={submenu===kind} data-axis-menu-trigger={kind} onMouseEnter={e=>openSubmenu(kind,e.currentTarget)} onFocus={e=>openSubmenu(kind,e.currentTarget)} onClick={e=>openSubmenu(kind,e.currentTarget)}><span className="axis-menu-label">{label}</span><ChevronRightIcon className="axis-menu-chevron"/></button>
 }
 const body=menu.kind==='price'?<>
  <button type="button" role="menuitem" onClick={()=>activate(()=>chart.priceScale(prefs.priceScaleSide).applyOptions({autoScale:true}))}>Auto (fits data to screen)</button>
  <div className="axis-menu-separator" role="separator"/>
  {toggle('Invert scale',prefs.priceScaleInverted,'priceScaleInverted')}
  <div className="axis-menu-separator" role="separator"/>
  {modes.map(option=>choice(option.label,prefs.priceScaleMode===option.value,()=>change({priceScaleMode:option.value})))}
  <div className="axis-menu-separator" role="separator"/>
  <button type="button" role="menuitem" onClick={()=>change({priceScaleSide:prefs.priceScaleSide==='right'?'left':'right'})}>Move scale to {prefs.priceScaleSide==='right'?'left':'right'}</button>
  <div className="axis-menu-separator" role="separator"/>
  {submenuTriggerButton('Labels','labels')}
  {submenuTriggerButton('Lines','lines')}
 </>:<>
  <button type="button" role="menuitem" onClick={()=>activate(()=>chart.timeScale().resetTimeScale())}><ResetIcon className="axis-menu-leading-icon"/><span className="axis-menu-label">Reset time scale</span></button>
  <div className="axis-menu-separator" role="separator"/>
  {submenuTriggerButton('Time zone','time-zone')}
 </>
 const submenuBody=submenu==='time-zone'?zones.map(option=>choice(option.label,prefs.displayTimezone===option.value,()=>change({displayTimezone:option.value})))
  :submenu==='labels'?<>{toggle('Price scale',prefs.showPriceScale,'showPriceScale')}{toggle('Last value label',prefs.showLastValue,'showLastValue')}</>
  :submenu==='lines'?toggle('Current price line',prefs.showPriceLine,'showPriceLine')
  :null
 return createPortal(<>
  <div ref={root} className={`workspace-axis-menu workspace-axis-menu--${menu.kind}`} role="menu" aria-label={menu.kind==='price'?'Price scale options':'Time scale options'} style={{left:position.left,top:position.top}} onKeyDown={keydown}>
   {body}
   <div className="axis-menu-separator" role="separator"/>
   <button type="button" role="menuitem" onClick={()=>activate(onOpenSettings)}><GearIcon className="axis-menu-leading-icon"/><span className="axis-menu-label">More settings…</span></button>
  </div>
  {submenu&&submenuBody?<div ref={submenuRoot} className={`workspace-axis-menu axis-menu-submenu axis-menu-submenu--${submenu}`} role="menu" aria-label={submenu==='time-zone'?'Time zone options':submenu==='labels'?'Price labels':'Price lines'} style={{left:submenuPosition.left,top:submenuPosition.top}} onKeyDown={keydown}>
   {submenuBody}
  </div>:null}
 </>,document.body)
}
