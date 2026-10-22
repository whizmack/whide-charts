import {expect,it} from 'vitest'
import {studyData} from './studyData'
import {defaultStudy} from './studies'
const bars=Array.from({length:100},(_,i)=>({time:(1700000000+i*60)*1000,open:100,high:110,low:90,close:100+i,volume:10}))
it('uses selected source and length for price overlays',()=>{
 const s={...defaultStudy('SMA'),period:2,source:'open' as const}
 expect(studyData(bars,'SMA',s).lines[0].data[0].value).toBe(100)
 expect(studyData(bars,'SMA',{...s,source:'close'}).lines[0].data[0].value).toBe(100.5)
})
it('RSI is bounded, includes smoothing, and retains canonical timestamps',()=>{
 const r=studyData(bars,'RSI',defaultStudy('RSI'))
 expect(r.lines).toHaveLength(2);expect(r.lines[0].data.every(p=>p.value===100)).toBe(true)
 expect(r.lines[0].data[0].time).toBe(bars[14].time/1000)
 expect(r.lines[1].data[0].time).toBe(bars[27].time/1000)
})
it('a replay prefix never produces indicator data at a future timestamp',()=>{
 for(const t of ['RSI','MACD','EMA','BOLL'] as const){
  const r=studyData(bars.slice(0,45),t,defaultStudy(t))
  expect([...r.lines.flatMap(l=>l.data),...r.histogram].every(p=>p.time<=bars[44].time/1000)).toBe(true)
 }
})
