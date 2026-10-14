import { expect, it } from 'vitest'
import process from 'node:process'
import { LiveFeed, parseHistory, streamURL } from '../web/live'
import { TIMEFRAMES, type Symbol } from '../web/replay'
const real = process.env.RUN_BINANCE_LIVE === '1' ? it : it.skip
// Opt-in only: these tests call the real public exchange. No keys or orders.
real('receives every supported symbol/timeframe from the documented endpoint',async()=>{
  for(const symbol of ['BTCUSDT','ETHUSDT','SOLUSDT'] as Symbol[]) {
    await Promise.all(TIMEFRAMES.map(timeframe=>new Promise<void>((resolve,reject)=>{
      const socket=new WebSocket(streamURL(symbol,timeframe))
      const timer=setTimeout(()=>{socket.close();reject(new Error(`${symbol}/${timeframe} timeout`))},12000)
      socket.onmessage=event=>{const e=JSON.parse(String(event.data));if(e.e==='kline'){
        try {expect(e.s).toBe(symbol);expect(e.k.i).toBe(timeframe);expect(Number(e.k.c)).toBeGreaterThan(0);console.log(symbol,timeframe,e.k.c,e.k.x)}
        catch(error){reject(error)}
        clearTimeout(timer);socket.close();resolve()
      }}
      socket.onerror=()=>{clearTimeout(timer);socket.close();reject(new Error(`${symbol}/${timeframe} connection error`))}
    })))
  }
},60000)
real('updates real prices, marks forced disconnect stale, then rehydrates and resumes',async()=>{
  const sockets:WebSocket[]=[],prices=new Set<number>();let loads=0,stale=false,resumed=false
  let resolve!:()=>void,reject!:(e:unknown)=>void
  const done=new Promise<void>((r,j)=>{resolve=r;reject=j})
  const feed=new LiveFeed('BTCUSDT','1m',state=>{
    if(state.status==='stale') stale=true
    if(state.status==='live') {
      prices.add(state.bars.at(-1)!.close)
      if(loads===1 && prices.size>=2) sockets[0].close()
      if(loads>=2 && stale) {resumed=true;resolve()}
    }
  },{socket:url=>{const s=new WebSocket(url);sockets.push(s);return s},load:async signal=>{
    loads++
    const response=await fetch('https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=1m&limit=1000',{signal})
    if(!response.ok) throw new Error(`REST ${response.status}`)
    return parseHistory(await response.json(),'1m')
  }})
  const timer=setTimeout(()=>reject(new Error('Real feed/reconnect timeout')),25000)
  try {feed.start();await done;expect(prices.size).toBeGreaterThanOrEqual(2);expect(loads).toBe(2);expect(stale&&resumed).toBe(true);console.log({prices:[...prices],loads,stale,resumed})}
  finally {clearTimeout(timer);feed.stop()}
},30000)
