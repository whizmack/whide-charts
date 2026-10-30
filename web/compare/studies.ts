import type { IndicatorType } from '@dylanpersonguy/opencharts'
import {nextBoundary,TIMEFRAMES,type Timeframe} from '../replay'
export type Magnet='none'|'weak'|'strong'
export type StudySettings={period:number;fast:number;slow:number;signal:number;stdDev:number;smoothing:number;source:'close'|'open'|'high'|'low'|'hl2'|'hlc3';color:string;secondaryColor:string;width:1|2|3|4;style:'solid'|'dashed'|'dotted';placement:'price'|'above'|'below';height:number;lineVisible:boolean;showPriceLabel:boolean;showStatusLineValues:boolean;showStatusLineInputs:boolean;visibleTimeframes:Timeframe[]}
export type SettingsMap=Partial<Record<IndicatorType,StudySettings>>
const oscillatorTypes:IndicatorType[]=['RSI','MACD','ATR','STOCH']
const colors:Record<IndicatorType,string>={SMA:'#f2c94c',EMA:'#2962ff',RSI:'#7e57c2',MACD:'#2962ff',BOLL:'#2962ff',ATR:'#f06292',STOCH:'#2962ff',VWAP:'#ff9800'}
export const paneTypes=(active:IndicatorType[])=>active.filter(type=>oscillatorTypes.includes(type))
export const isOscillator=(type:IndicatorType)=>oscillatorTypes.includes(type)
export function defaultStudy(type:IndicatorType):StudySettings {return {period:type==='RSI'||type==='ATR'||type==='STOCH'?14:20,fast:12,slow:26,signal:type==='STOCH'?3:9,stdDev:2,smoothing:14,source:'close',color:colors[type],secondaryColor:type==='RSI'?'#e0c52b':'#ff9800',width:1,style:'solid',placement:isOscillator(type)?'below':'price',height:170,lineVisible:true,showPriceLabel:true,showStatusLineValues:true,showStatusLineInputs:true,visibleTimeframes:[...TIMEFRAMES]}}
const bound=(value:unknown,fallback:number,min:number,max:number)=>typeof value==='number'&&Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback
export function normalizeStudy(type:IndicatorType,value:Partial<StudySettings>):StudySettings {
  const d=defaultStudy(type),fast=Math.round(bound(value.fast,d.fast,1,499))
  const supportedValue={...value} as Partial<StudySettings> & {precision?:number|null}
  delete supportedValue.precision
  const visibleTimeframes=Array.isArray(value.visibleTimeframes)?value.visibleTimeframes:TIMEFRAMES
  return {...d,...supportedValue,smoothing:Math.round(bound(value.smoothing,d.smoothing,1,500)),period:Math.round(bound(value.period,d.period,1,500)),height:Math.round(bound(value.height,d.height,100,400)),fast,slow:Math.round(bound(value.slow,d.slow,fast+1,500)),signal:Math.round(bound(value.signal,d.signal,1,500)),stdDev:bound(value.stdDev,d.stdDev,0.1,10),width:Math.round(bound(value.width,d.width,1,4)) as StudySettings['width'],color:/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.color??'')?value.color!:d.color,secondaryColor:/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.secondaryColor??'')?value.secondaryColor!:d.secondaryColor,placement:isOscillator(type)?value.placement==='above'?'above':'below':'price',source:['close','open','high','low','hl2','hlc3'].includes(value.source??'')?value.source!:d.source,style:['solid','dashed','dotted'].includes(value.style??'')?value.style!:d.style,lineVisible:typeof value.lineVisible==='boolean'?value.lineVisible:d.lineVisible,showPriceLabel:typeof value.showPriceLabel==='boolean'?value.showPriceLabel:d.showPriceLabel,showStatusLineValues:typeof value.showStatusLineValues==='boolean'?value.showStatusLineValues:d.showStatusLineValues,showStatusLineInputs:typeof value.showStatusLineInputs==='boolean'?value.showStatusLineInputs:d.showStatusLineInputs,visibleTimeframes:TIMEFRAMES.filter(timeframe=>visibleTimeframes.includes(timeframe))}
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
type CountdownCandle={open:number;close:number}
type CountdownPreferences={colorBarsByPreviousClose:boolean;candleBullBodyColor:string;candleBearBodyColor:string}
type CountdownFallback={up:string;down:string}
/** Match the countdown background to the same body-color rule used for the latest candle. */
export function lastCandleBodyColor(last:CountdownCandle,previous:{close:number}|undefined,prefs:CountdownPreferences,fallback:CountdownFallback):string {
  const up=prefs.colorBarsByPreviousClose&&previous!==undefined?last.close>=previous.close:last.close>=last.open
  return up?(prefs.candleBullBodyColor||fallback.up):(prefs.candleBearBodyColor||fallback.down)
}

/** Keep the price line at the vertical midpoint of the combined price/countdown tag. */
export function lastPriceBadgePlacement(y:number,paneHeight:number,width:number,showPrice:boolean):{top:number;width:number}|null {
  if(!Number.isFinite(y)||!Number.isFinite(paneHeight)||!Number.isFinite(width)||paneHeight<=0||width<=0||y<0||y>paneHeight)return null
  const priceHeight=16,countdownHeight=16
  const height=(showPrice?priceHeight:0)+countdownHeight
  const maxTop=Math.max(0,paneHeight-height)
  const top=Math.max(0,Math.min(maxTop,y-height/2))
  return {top,width}
}

/** Place a secondary axis tag beside occupied labels without moving the live-price tag. */
export function nonOverlappingPriceLabelTop(centerY:number,paneHeight:number,labelHeight:number,occupied:[number,number][],preferDown:boolean):number|null {
  if(!Number.isFinite(centerY)||!Number.isFinite(paneHeight)||paneHeight<labelHeight)return null
  const maxTop=paneHeight-labelHeight
  const preferred=Math.max(0,Math.min(maxTop,centerY-labelHeight/2))
  const clear=(top:number)=>occupied.every(([start,end])=>top>=end+2||top+labelHeight<=start-2)
  if(clear(preferred))return preferred
  for(let offset=1;offset<=paneHeight;offset++){
    for(const top of preferDown?[preferred+offset,preferred-offset]:[preferred-offset,preferred+offset]){
      if(top>=0&&top<=maxTop&&clear(top))return top
    }
  }
  return null
}

/** Match the foreground chosen by Lightweight Charts for a last-value axis label. */
export function priceBadgeTextColor(color:string):string {
  const hex=/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(color.trim())?.[1]
  const rgb=hex
    ? hex.length<=4?hex.slice(0,3).split('').map(channel=>parseInt(channel+channel,16)):[0,2,4].map(index=>parseInt(hex.slice(index,index+2),16))
    : /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color)?.slice(1,4).map(Number)
  if(!rgb||rgb.some(channel=>!Number.isFinite(channel)))return '#fff'
  return .299*rgb[0]+.587*rgb[1]+.114*rgb[2]>160?'#000':'#fff'
}
type Range={from:number;to:number}
type Viewport={set:(range:Range)=>void;subscribe:(fn:(range:Range|null)=>void)=>()=>void}
export function syncViewport(ports:Viewport[]) {
  let syncing=false
  const off=ports.map((port,index)=>port.subscribe(range=>{if(!range||syncing)return;syncing=true;try{ports.forEach((target,i)=>{if(i!==index)target.set(range)})}finally{syncing=false}}))
  return ()=>off.forEach(fn=>fn())
}
