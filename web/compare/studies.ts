import type { IndicatorType } from '@dylanpersonguy/opencharts'
import {nextBoundary,type Timeframe} from '../replay'
export type Magnet='none'|'weak'|'strong'
export type StudySettings={period:number;fast:number;slow:number;signal:number;stdDev:number;smoothing:number;source:'close'|'open'|'high'|'low'|'hl2'|'hlc3';color:string;secondaryColor:string;width:1|2|3|4;style:'solid'|'dashed'|'dotted';placement:'price'|'above'|'below';height:number}
export type SettingsMap=Partial<Record<IndicatorType,StudySettings>>
const oscillatorTypes:IndicatorType[]=['RSI','MACD','ATR','STOCH']
const colors:Record<IndicatorType,string>={SMA:'#f2c94c',EMA:'#2962ff',RSI:'#7e57c2',MACD:'#2962ff',BOLL:'#2962ff',ATR:'#f06292',STOCH:'#2962ff',VWAP:'#ff9800'}
export const paneTypes=(active:IndicatorType[])=>active.filter(type=>oscillatorTypes.includes(type))
export const isOscillator=(type:IndicatorType)=>oscillatorTypes.includes(type)
export function defaultStudy(type:IndicatorType):StudySettings {return {period:type==='RSI'||type==='ATR'||type==='STOCH'?14:20,fast:12,slow:26,signal:type==='STOCH'?3:9,stdDev:2,smoothing:14,source:'close',color:colors[type],secondaryColor:type==='RSI'?'#e0c52b':'#ff9800',width:1,style:'solid',placement:isOscillator(type)?'below':'price',height:170}}
const bound=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback
export function normalizeStudy(type:IndicatorType,value:Partial<StudySettings>):StudySettings {
  const d=defaultStudy(type),fast=Math.round(bound(value.fast,d.fast,1,499))
  return {...d,...value,smoothing:Math.round(bound(value.smoothing,d.smoothing,1,500)),period:Math.round(bound(value.period,d.period,1,500)),height:Math.round(bound(value.height,d.height,100,400)),fast,slow:Math.round(bound(value.slow,d.slow,fast+1,500)),signal:Math.round(bound(value.signal,d.signal,1,500)),stdDev:bound(value.stdDev,d.stdDev,0.1,10),width:Math.round(bound(value.width,d.width,1,4)) as StudySettings['width'],color:/^#[0-9a-f]{6}$/i.test(value.color??'')?value.color!:d.color,secondaryColor:/^#[0-9a-f]{6}$/i.test(value.secondaryColor??'')?value.secondaryColor!:d.secondaryColor,placement:isOscillator(type)?value.placement==='above'?'above':'below':'price',source:['close','open','high','low','hl2','hlc3'].includes(value.source??'')?value.source!:d.source,style:['solid','dashed','dotted'].includes(value.style??'')?value.style!:d.style}
}
export function effectiveMagnet(persistent:Magnet,held:boolean):Magnet {return held&&persistent==='none'?'weak':persistent}
/** Track Cmd/Ctrl from key identity. Meta keyup still reports metaKey=true on macOS. */
export function applyModifierKey(held:Iterable<string>,e:{type:string;key?:string}):Set<string> {
  const next=new Set(held)
  if(e.type==='blur'||e.type==='visibilitychange')return new Set()
  if(e.key!=='Meta'&&e.key!=='Control')return next
  if(e.type==='keydown')next.add(e.key);else next.delete(e.key)
  return next
}
export function barCloseCountdown(now:number,timeframe:Timeframe):string {
  const total=Math.floor(Math.max(0,nextBoundary(now,timeframe)-now)/1000),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60
  return h>0?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`
}
const PRICE_ROW=18,COUNT_ROW=14
/** Badge top so the price row is centered on the last-price line; countdown hangs below. */
export function lastPriceBadgePlace(y:number|null,paneHeight:number,scaleWidth:number,priceRow=PRICE_ROW,countRow=COUNT_ROW) {
  if(y===null||!Number.isFinite(y)||paneHeight<=0||scaleWidth<=0)return null
  const height=priceRow+countRow
  const top=Math.min(Math.max(0,y-priceRow/2),Math.max(0,paneHeight-height))
  return {top,width:scaleWidth}
}
type Range={from:number;to:number}
type Viewport={set:(range:Range)=>void;subscribe:(fn:(range:Range|null)=>void)=>()=>void}
export function syncViewport(ports:Viewport[]) {
  let syncing=false
  const off=ports.map((port,index)=>port.subscribe(range=>{if(!range||syncing)return;syncing=true;try{ports.forEach((target,i)=>{if(i!==index)target.set(range)})}finally{syncing=false}}))
  return ()=>off.forEach(fn=>fn())
}
