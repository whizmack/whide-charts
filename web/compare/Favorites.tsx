import {useEffect,useLayoutEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent} from 'react'
import {DRAWING_TOOL_GROUPS,type DrawingTool} from '@dylanpersonguy/opencharts'

type Point={x:number;y:number}
type Size={width:number;height:number}
export type FavoritesPreferences={tools:DrawingTool[];position:Point|null;open:boolean}
const definitions=DRAWING_TOOL_GROUPS.flatMap(group=>group.tools)
const allowed=new Set(definitions.map(item=>item.tool))

export function parseFavorites(value:unknown):FavoritesPreferences{
 const input=value&&typeof value==='object'?value as Record<string,unknown>:{}
 const tools=Array.isArray(input.tools)?[...new Set(input.tools.filter((tool):tool is DrawingTool=>typeof tool==='string'&&allowed.has(tool as DrawingTool)))]:[]
 const position=input.position&&typeof input.position==='object'?input.position as Record<string,unknown>:null
 const valid=position&&typeof position.x==='number'&&Number.isFinite(position.x)&&typeof position.y==='number'&&Number.isFinite(position.y)
 return {tools,position:valid?{x:position.x as number,y:position.y as number}:null,open:input.open===true}
}
export function clampFavoritePosition(position:Point,area:Size,bar:Size):Point{
 return {x:Math.max(0,Math.min(position.x,Math.max(0,area.width-bar.width))),y:Math.max(0,Math.min(position.y,Math.max(0,area.height-bar.height)))}
}
export function favoritePickerPlacement(position:Point,area:Size,bar:Size){
 const width=Math.min(220,area.width),above=Math.max(0,position.y-4),below=Math.max(0,area.height-position.y-bar.height-4),opensUp=above>below
 return {left:Math.max(-position.x,Math.min(bar.width-width,area.width-position.x-width))||0,width,maxHeight:Math.min(420,opensUp?above:below),opensUp}
}

export function Favorites({value,onChange,onSelect,selected}:{value:FavoritesPreferences;onChange:(value:FavoritesPreferences)=>void;onSelect:(tool:DrawingTool)=>void;selected:DrawingTool}){
 const area=useRef<HTMLDivElement>(null),bar=useRef<HTMLDivElement>(null),picker=useRef<HTMLDivElement>(null),pickerButton=useRef<HTMLButtonElement>(null)
 const drag=useRef<{pointer:number;start:Point;origin:Point}|null>(null)
 const [position,setPosition]=useState<Point>({x:0,y:0}),[choosing,setChoosing]=useState(false),[sizes,setSizes]=useState<{area:Size;bar:Size}>({area:{width:0,height:0},bar:{width:0,height:0}})
 const bound=(point:Point)=>{const a=area.current?.getBoundingClientRect(),b=bar.current?.getBoundingClientRect();return a&&b?clampFavoritePosition(point,a,b):point}
 useLayoutEffect(()=>{
  if(!value.open||!area.current||!bar.current)return
  const place=()=>{const a=area.current!.getBoundingClientRect(),b=bar.current!.getBoundingClientRect();setSizes({area:{width:a.width,height:a.height},bar:{width:b.width,height:b.height}});setPosition(clampFavoritePosition(value.position??{x:(a.width-b.width)/2,y:Math.min(110,a.height/3)},a,b))}
  place();const observer=new ResizeObserver(place);observer.observe(area.current);observer.observe(bar.current);return()=>observer.disconnect()
 },[value.open,value.position,value.tools])
 useEffect(()=>{
  if(!choosing)return
  const outside=(e:PointerEvent)=>{if(e.target instanceof Node&&!picker.current?.contains(e.target)&&!pickerButton.current?.contains(e.target))setChoosing(false)}
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setChoosing(false);pickerButton.current?.focus()}}
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape)}
 },[choosing])
 const moveKey=(e:ReactKeyboardEvent<HTMLButtonElement>)=>{const delta:Record<string,Point>={ArrowLeft:{x:-10,y:0},ArrowRight:{x:10,y:0},ArrowUp:{x:0,y:-10},ArrowDown:{x:0,y:10}};const d=delta[e.key];if(!d)return;e.preventDefault();const next=bound({x:position.x+d.x,y:position.y+d.y});setPosition(next);onChange({...value,position:next})}
 const placement=favoritePickerPlacement(position,sizes.area,sizes.bar)
 return <>
  <button className="favorites-toggle" type="button" aria-label="Favorite drawing tools" title="Favorite drawing tools" aria-pressed={value.open} onClick={()=>{onChange({...value,open:!value.open});setChoosing(false)}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.5 3 6.1 6.8 1-4.9 4.8 1.2 6.8-6.1-3.2-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1z"/></svg></button>
  {value.open?<div ref={area} className="favorites-area"><div ref={bar} className="favorites-bar" role="toolbar" aria-label="Favorite drawing tools" style={{left:position.x,top:position.y}}>
   <button className="favorites-handle" type="button" title="Move favorites toolbar" aria-label="Move favorites toolbar with arrow keys" onKeyDown={moveKey} onPointerDown={e=>{if(e.button!==0)return;drag.current={pointer:e.pointerId,start:{x:e.clientX,y:e.clientY},origin:position};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=drag.current;if(d?.pointer===e.pointerId)setPosition(bound({x:d.origin.x+e.clientX-d.start.x,y:d.origin.y+e.clientY-d.start.y}))}} onPointerUp={e=>{const d=drag.current;if(d?.pointer===e.pointerId){const next=bound({x:d.origin.x+e.clientX-d.start.x,y:d.origin.y+e.clientY-d.start.y});drag.current=null;onChange({...value,position:next})}}} onLostPointerCapture={()=>{drag.current=null}}><span aria-hidden="true">⠿</span></button>
   <div className="favorites-tools">{value.tools.map(tool=>{const item=definitions.find(def=>def.tool===tool);if(!item)return null;const Icon=item.icon;return <button key={tool} data-favorite-tool={tool} type="button" title={item.label} aria-label={item.label} aria-pressed={selected===tool} onClick={()=>onSelect(tool)}><Icon aria-hidden="true"/></button>})}</div>
   <button ref={pickerButton} className="favorites-edit" type="button" title="Choose favorite tools" aria-label="Choose favorite tools" aria-expanded={choosing} onClick={()=>setChoosing(!choosing)}>★</button>
   {choosing?<div ref={picker} className={`favorites-picker${placement.opensUp?' opens-up':''}`} style={{left:placement.left,right:'auto',width:placement.width,maxHeight:placement.maxHeight}} role="group" aria-label="Choose favorite tools">{DRAWING_TOOL_GROUPS.map(group=><section key={group.id}><h3>{group.label}</h3>{group.tools.map(item=>{const Icon=item.icon,checked=value.tools.includes(item.tool);return <button key={item.tool} type="button" role="checkbox" aria-checked={checked} onClick={()=>onChange({...value,tools:checked?value.tools.filter(t=>t!==item.tool):[...value.tools,item.tool]})}><Icon aria-hidden="true"/><span>{item.label}</span><span aria-hidden="true">{checked?'★':'☆'}</span></button>})}</section>)}</div>:null}
  </div></div>:null}
 </>
}
