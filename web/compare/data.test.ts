import { expect,it } from 'vitest'
import { chartWindow, visibleDrawings } from './data'
const bar=(time:number)=>({time,open:100,high:102,low:99,close:101,volume:5})
it('converts milliseconds once and respects exclusive pagination bounds',()=>{
  const frame={symbol:'BTCUSDT',timeframe:'5m',bars:[bar(300000),bar(600000),bar(900000)]}
  expect(chartWindow(frame,{symbol:'BTCUSDT',timeframe:'5m',fromMs:300000,toMs:900000})).toEqual([bar(300),bar(600)])
  expect(chartWindow(frame,{symbol:'ETHUSDT',timeframe:'5m'})).toEqual([])
  expect(chartWindow(frame,{symbol:'BTCUSDT',timeframe:'1h'})).toEqual([])
  expect(chartWindow(frame,{symbol:'BTCUSDT',timeframe:'5m',limit:1})).toEqual([bar(900)])
})
it('never returns data outside the supplied safe prefix even for a future request',()=>{
  expect(chartWindow({symbol:'BTCUSDT',timeframe:'1h',bars:[bar(3600000)]},{symbol:'BTCUSDT',timeframe:'1h',toMs:9999999999})).toEqual([bar(3600)])
})
it('hides future replay drawings but leaves live drawings independent of the bucket clock',()=>{
  const drawings=[{id:'past',asOf:100},{id:'future',asOf:300}]
  expect(visibleDrawings(drawings,'replay',200).map(d=>d.id)).toEqual(['past'])
  expect(visibleDrawings(drawings,'live',0)).toEqual(drawings)
})
