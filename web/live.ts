import type { Bar } from './api'
import { MINUTES, type Symbol, type Timeframe } from './replay'
export const streamURL = (symbol: Symbol, timeframe: Timeframe) => `wss://fstream.binance.com/market/ws/${symbol.toLowerCase()}@kline_${timeframe}`
export type LiveState = { bars: Bar[]; status: 'connecting' | 'syncing' | 'live' | 'stale'; lastUpdate: number | null; error: string }
type Socket = Pick<WebSocket, 'onopen' | 'onmessage' | 'onerror' | 'onclose' | 'close'>
type Dependencies = { socket: (url:string) => Socket; load: (signal:AbortSignal) => Promise<Bar[]> }
function valid(bar:Bar) {
  return Object.values(bar).every(Number.isFinite) && Number.isInteger(bar.time) && bar.time > 0 && bar.volume >= 0 && bar.low > 0 && bar.low <= Math.min(bar.open,bar.close) && bar.high >= Math.max(bar.open,bar.close)
}
export function parseHistory(rows:unknown, timeframe:Timeframe):Bar[] {
  if (!Array.isArray(rows) || !rows.length) throw new Error('Binance returned no candles.')
  const bars=rows.map(r=>({time:Number(r[0]),open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[5])}))
  const width=MINUTES[timeframe]*60000
  if (bars.some((b,i)=>!valid(b) || b.time%width!==0 || (i>0 && b.time!==bars[i-1].time+width))) throw new Error('Binance history contains invalid data or a gap.')
  return bars
}
export function parseKline(raw:string,symbol:Symbol,timeframe:Timeframe):{bar:Bar;eventTime:number}|null {
  try {
    const value=JSON.parse(raw), k=value.k
    if (value.e!=='kline' || value.s!==symbol || !k || k.s!==symbol || k.i!==timeframe) return null
    const bar={time:Number(k.t),open:Number(k.o),high:Number(k.h),low:Number(k.l),close:Number(k.c),volume:Number(k.v)}
    const eventTime=Number(value.E)
    return valid(bar) && bar.time%(MINUTES[timeframe]*60000)===0 && Number.isFinite(eventTime) ? {bar,eventTime} : null
  } catch { return null }
}
/** Owns only an ephemeral rolling live window. Never writes to the replay store. */
export class LiveFeed {
  private state:LiveState={bars:[],status:'connecting',lastUpdate:null,error:''}
  private running=false
  private generation=0
  private socket?:Socket
  private abort?:AbortController
  private retry?:ReturnType<typeof setTimeout>
  private watchdog?:ReturnType<typeof setInterval>
  private attempts=0
  constructor(private symbol:Symbol,private timeframe:Timeframe,private emit:(state:LiveState)=>void,private deps:Dependencies={
    socket:url=>new WebSocket(url),
    load:async signal=>{
      const res=await fetch(`/api/live/klines?symbol=${symbol}&timeframe=${timeframe}`,{signal,cache:'no-store'})
      if (!res.ok) throw new Error('Public Binance data is unavailable. Reconnecting automatically.')
      return parseHistory(await res.json(),timeframe)
    },
  }) {}
  private publish(patch:Partial<LiveState>) { this.state={...this.state,...patch};this.emit(this.state) }
  start() { if (this.running) return;this.running=true;this.connect() }
  private connect() {
    if (!this.running) return
    const generation=++this.generation, started=Date.now(), width=MINUTES[this.timeframe]*60000, hasExistingBars=this.state.bars.length>0
    let received=started, hydrated=false, eventTime=0
    const buffered=new Map<number,{bar:Bar;eventTime:number}>()
    const current=()=>this.running && generation===this.generation
    const fail=(error='Connection lost. Reconnecting and syncing candles…')=>{
      if (!current()) return
      ++this.generation;this.abort?.abort();this.socket?.close();clearInterval(this.watchdog)
      this.publish({status:'stale',error})
      this.retry=setTimeout(()=>this.connect(),Math.min(30000,1000*2**Math.min(this.attempts++,5)))
    }
    this.publish({status:this.state.bars.length?'stale':'connecting'})
    try { this.socket=this.deps.socket(streamURL(this.symbol,this.timeframe)) } catch { fail();return }
    const socket=this.socket
    socket.onclose=()=>fail();socket.onerror=()=>fail()
    socket.onopen=()=>{
      if (!current()) return
      this.publish({status:hasExistingBars?'stale':'syncing'})
    }
    socket.onmessage=event=>{
      if (!current() || typeof event.data!=='string') return
      const parsed=parseKline(event.data,this.symbol,this.timeframe)
      if (!parsed || parsed.eventTime<eventTime || Date.now()-parsed.eventTime>15000) return
      eventTime=parsed.eventTime;received=Date.now()
      if (!hydrated) {buffered.set(parsed.bar.time,parsed);return}
      const bars=this.state.bars, last=bars.at(-1)
      if (!last || parsed.bar.time>last.time+width) {fail('Backfilling missing candles…');return}
      if(parsed.bar.time<last.time) return
      const next=parsed.bar.time===last.time?[...bars.slice(0,-1),parsed.bar]:[...bars,parsed.bar].slice(-1000)
      this.attempts=0;this.publish({bars:next,status:'live',lastUpdate:received,error:''})
    }
    // REST history and the WebSocket handshake are independent. Start both at
    // once so a slow handshake does not keep the chart empty.
    this.abort=new AbortController()
    void this.deps.load(this.abort.signal).then(bars=>{
      if (!current()) return
      // Replace the complete rolling window, including missed closed candles.
      // Buffered stream events win over the REST snapshot during hydration.
      const merged=new Map(bars.map(b=>[b.time,b]))
      for (const {bar} of buffered.values()) if(bar.time>=bars[0].time) merged.set(bar.time,bar)
      const result=[...merged.values()].sort((a,b)=>a.time-b.time).slice(-1000)
      if (result.some((b,i)=>i>0 && b.time!==result[i-1].time+width)) {fail('Backfilling missing candles…');return}
      hydrated=true
      this.publish({bars:result,status:buffered.size?'live':'syncing',lastUpdate:buffered.size?received:null,error:''})
      if(buffered.size) this.attempts=0
    }).catch(()=>{if(current()) fail('Unable to download candles. Retrying…')})
    this.watchdog=setInterval(()=>{if(Date.now()-received>15000 || (!hydrated && Date.now()-started>15000)) fail('Data is stale. Reconnecting…')},1000)
  }
  stop() {this.running=false;++this.generation;clearTimeout(this.retry);clearInterval(this.watchdog);this.abort?.abort();this.socket?.close()}
}
