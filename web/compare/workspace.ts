import type {IndicatorType} from '@dylanpersonguy/opencharts'
import {TIMEFRAMES,type Symbol,type Timeframe} from '../replay'
import {normalizeStudy,type SettingsMap} from './studies'
export type Layout='one'|'columns'|'rows'|'three'|'four'
export type CellConfig={id:string;symbol:Symbol;timeframe:Timeframe;indicators:IndicatorType[];studies:SettingsMap}
export type Workspace={layout:Layout;active:string;cells:CellConfig[];asOf:number;syncTime:boolean;syncCrosshair:boolean;column:number;row:number}
export const studyTypes:IndicatorType[]=['SMA','EMA','RSI','MACD','BOLL','ATR','STOCH','VWAP']
export function initialWorkspace():Workspace{return {layout:'one',active:'chart-1',cells:[0,1,2,3].map((n)=>({id:`chart-${n+1}`,symbol:'BTCUSDT',timeframe:(['5m','15m','1h','4h'] as const)[n],indicators:n===0?['EMA','RSI']:[],studies:{}})),asOf:Date.UTC(2023,0,8),syncTime:false,syncCrosshair:true,column:50,row:50}}
export function loadWorkspace(raw:unknown):Workspace{
  const d=initialWorkspace();if(!raw||typeof raw!=='object')return d
  const v=raw as Partial<Workspace>
  const cells=d.cells.map((fallback,i)=>{
    const cell=v.cells?.[i];if(!cell||typeof cell!=='object')return fallback
    const studies:SettingsMap={};for(const type of studyTypes)if(cell.studies?.[type])studies[type]=normalizeStudy(type,cell.studies[type]!)
    return {...fallback,symbol:['BTCUSDT','ETHUSDT','SOLUSDT'].includes(cell.symbol)?cell.symbol:fallback.symbol,timeframe:TIMEFRAMES.includes(cell.timeframe)?cell.timeframe:fallback.timeframe,indicators:Array.isArray(cell.indicators)?studyTypes.filter(t=>cell.indicators.includes(t)):fallback.indicators,studies}
  })
  return {...d,cells,layout:['one','columns','rows','three','four'].includes(v.layout??'')?v.layout!:d.layout,active:cells.some(c=>c.id===v.active)?v.active!:d.active,asOf:typeof v.asOf==='number'&&Number.isFinite(v.asOf)&&v.asOf>=Date.UTC(2023,0,1)&&v.asOf<=Date.now()?v.asOf:d.asOf,syncTime:typeof v.syncTime==='boolean'?v.syncTime:d.syncTime,syncCrosshair:typeof v.syncCrosshair==='boolean'?v.syncCrosshair:d.syncCrosshair,column:typeof v.column==='number'?Math.min(75,Math.max(25,v.column)):50,row:typeof v.row==='number'?Math.min(75,Math.max(25,v.row)):50}
}
export const visibleIds=(w:Workspace)=>w.cells.slice(0,w.layout==='one'?1:w.layout==='four'?4:w.layout==='three'?3:2).map(c=>c.id)
export function changeCell(w:Workspace,id:string,patch:Partial<Omit<CellConfig,'id'>>):Workspace{return {...w,cells:w.cells.map(c=>c.id===id?{...c,...patch}:c)}}
export function timeAt(times:number[],logical:number,width:number):number{
  if(!times.length)return 0
  if(logical<=0)return times[0]+logical*width
  const last=times.length-1;if(logical>=last)return times[last]+(logical-last)*width
  const i=Math.floor(logical);return times[i]+(times[i+1]-times[i])*(logical-i)
}
export function logicalAt(times:number[],time:number,width:number):number{
  if(!times.length)return 0
  if(time<=times[0])return (time-times[0])/width
  const last=times.length-1;if(time>=times[last])return last+(time-times[last])/width
  let lo=0,hi=last;while(hi-lo>1){const m=(lo+hi)>>1;if(times[m]<=time)lo=m;else hi=m}
  return lo+(time-times[lo])/(times[hi]-times[lo])
}
