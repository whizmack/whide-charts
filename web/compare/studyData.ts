import {sma,ema,rsi,macd,bollingerBands,atr,stochastic,vwap,type IndicatorType} from '@dylanpersonguy/opencharts'
import type {Bar} from '../api'
import type {StudySettings} from './studies'
type Point={time:number;value:number}
export type StudyData={lines:{color:string;data:Point[]}[];histogram:(Point&{color:string})[]}
export function studyData(bars:Bar[],type:IndicatorType,s:StudySettings):StudyData{
 const raw=bars.map(b=>({...b,time:b.time/1000})),src=raw.map(b=>({...b,close:s.source==='hl2'?(b.high+b.low)/2:s.source==='hlc3'?(b.high+b.low+b.close)/3:b[s.source]}))
 const line=(data:Point[],color=s.color)=>({data,color})
 switch(type){
  case 'SMA':return {lines:[line(sma(src,s.period))],histogram:[]}
  case 'EMA':return {lines:[line(ema(src,s.period))],histogram:[]}
  case 'RSI':{const points=rsi(src,s.period);return {lines:[line(points),line(sma(points.map(p=>({time:p.time,open:p.value,high:p.value,low:p.value,close:p.value})),s.smoothing),s.secondaryColor)],histogram:[]}}
  case 'MACD':{const m=macd(src,s.fast,s.slow,s.signal);return {lines:[line(m.macd),line(m.signal,s.secondaryColor)],histogram:m.histogram.map((p,i)=>({...p,color:p.value>=0?(p.value>=(m.histogram[i-1]?.value??0)?'#26a69a':'#b2dfdb'):(p.value>=(m.histogram[i-1]?.value??0)?'#ffcdd2':'#ef5350')}))}}
  case 'BOLL':{const b=bollingerBands(src,s.period,s.stdDev);return {lines:[line(b.middle,s.secondaryColor),line(b.upper),line(b.lower)],histogram:[]}}
  case 'ATR':return {lines:[line(atr(raw,s.period))],histogram:[]}
  case 'STOCH':{const v=stochastic(raw,s.period,s.signal);return {lines:[line(v.k),line(v.d,s.secondaryColor)],histogram:[]}}
  case 'VWAP':{ // VWAP resets by UTC day within the loaded history. The legend discloses that window limit.
   const points:Point[]=[];let day=-1,session:typeof raw=[]
   for(const b of raw){const next=Math.floor(b.time/86400);if(next!==day){if(session.length)points.push(...vwap(session));session=[];day=next}session.push(b)}
   if(session.length)points.push(...vwap(session));return {lines:[line(points)],histogram:[]}
  }
 }
}
