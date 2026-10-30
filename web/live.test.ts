import { afterEach, expect, it, vi } from 'vitest'
import { LiveFeed, loadLiveHistoryPage, parseKline, parseHistory, type LiveState } from './live'
const width = 60000, now = 1792009400000, start = Math.floor(now/width)*width
const row = (t:number,c=100) => [t,'99','102','98',String(c),'5']
const message = (t=start,c=101,s='BTCUSDT') => JSON.stringify({ e:'kline', E:now, s, k:{s,i:'1m',t,o:'99',h:'102',l:'98',c:String(c),v:'6'} })
class Socket {
  onopen:(()=>void)|null=null; onmessage:((e:{data:string})=>void)|null=null
  onerror:(()=>void)|null=null; onclose:(()=>void)|null=null
  close=vi.fn()
  send(data:string) { this.onmessage?.({data}) }
}
function setup(history = [row(start-width), row(start)],loadImplementation?:(signal:AbortSignal)=>Promise<ReturnType<typeof parseHistory>>) {
  vi.useFakeTimers(); vi.setSystemTime(now)
  const sockets:Socket[]=[], states:LiveState[]=[]
  const load=vi.fn(loadImplementation??(async (_signal:AbortSignal) => parseHistory(history,'1m')))
  const feed=new LiveFeed('BTCUSDT','1m',s=>states.push(s),{socket:()=>{const s=new Socket();sockets.push(s);return s},load})
  feed.start()
  return {feed,sockets,states,load}
}
afterEach(()=>vi.useRealTimers())
it('validates symbol, interval and OHLCV, and refuses malformed prices',()=>{
  expect(parseKline(message(),'BTCUSDT','1m')?.bar.close).toBe(101)
  expect(parseKline(message(start,101,'ETHUSDT'),'BTCUSDT','1m')).toBeNull()
  expect(parseKline(message().replace('"1m"','"5m"'),'BTCUSDT','1m')).toBeNull()
  expect(parseKline(message(start,NaN),'BTCUSDT','1m')).toBeNull()
  expect(()=>parseHistory([row(start),row(start+width*2)],'1m')).toThrow()
})
it('loads a bounded older Binance page and converts the half-open upper bound',async()=>{
  const fetcher=vi.fn(async(_input:RequestInfo|URL,_options?:RequestInit)=>({ok:true,json:async()=>[row(start-2*width)]}))
  vi.stubGlobal('fetch',fetcher)
  const bars=await loadLiveHistoryPage('BTCUSDT','1m',start-2*width,start-width,500)
  const [url,options]=fetcher.mock.calls[0]
  const query=new URL(String(url),'http://localhost').searchParams
  expect(query.get('symbol')).toBe('BTCUSDT')
  expect(query.get('timeframe')).toBe('1m')
  expect(query.get('startTime')).toBe(String(start-2*width))
  expect(query.get('endTime')).toBe(String(start-width-1))
  expect(query.get('limit')).toBe('500')
  expect(options).toMatchObject({cache:'no-store'})
  expect(bars).toEqual([{time:start-2*width,open:99,high:102,low:98,close:100,volume:5}])
})
it('returns an empty older page without inventing candles',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[]})))
  await expect(loadLiveHistoryPage('BTCUSDT','1m',start-2*width,start-width,500)).resolves.toEqual([])
})
it('rejects malformed or gapped older pages',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[row(start-3*width),row(start-width)]})))
  await expect(loadLiveHistoryPage('BTCUSDT','1m',start-3*width,start,500)).rejects.toThrow('gap')
})
it('hydrates Live history while the WebSocket is still connecting',async()=>{
  const {feed,sockets,states,load}=setup()
  expect(load).toHaveBeenCalledOnce()
  await vi.advanceTimersByTimeAsync(0)
  expect(states.at(-1)?.bars).toHaveLength(2)
  expect(states.at(-1)?.status).toBe('syncing')
  sockets[0].onopen?.()
  sockets[0].send(message(start,102))
  expect(states.at(-1)?.status).toBe('live')
  expect(states.at(-1)?.bars.at(-1)?.close).toBe(102)
  feed.stop()
})
it('buffers stream during REST hydration and updates the current candle',async()=>{
  const {feed,sockets,states}=setup();sockets[0].onopen?.();sockets[0].send(message(start,102))
  await vi.advanceTimersByTimeAsync(0)
  expect(states.at(-1)?.status).toBe('live'); expect(states.at(-1)?.bars.at(-1)?.close).toBe(102)
  sockets[0].send(message(start,100)); expect(states.at(-1)?.bars).toHaveLength(2)
  expect(states.at(-1)?.bars.at(-1)?.close).toBe(100)
  feed.stop(); sockets[0].send(message(start,102));expect(states.at(-1)?.bars.at(-1)?.close).toBe(100)
})
it('marks stale, reconnects and backfills missing bars before becoming live',async()=>{
  const {feed,sockets,states,load}=setup();sockets[0].onopen?.();await vi.advanceTimersByTimeAsync(0)
  sockets[0].send(message());sockets[0].onclose?.()
  expect(states.at(-1)?.status).toBe('stale')
  load.mockResolvedValueOnce(parseHistory([row(start-width),row(start),row(start+width),row(start+2*width)],'1m'))
  await vi.advanceTimersByTimeAsync(1000);sockets[1].onopen?.();sockets[1].send(message(start+2*width))
  await vi.advanceTimersByTimeAsync(0)
  expect(load).toHaveBeenCalledTimes(2);expect(states.at(-1)?.bars).toHaveLength(4);expect(states.at(-1)?.status).toBe('live')
  feed.stop()
})
it('detects silent connections and candle gaps, and cancels retry on stop',async()=>{
  const {feed,sockets,states}=setup();sockets[0].onopen?.();await vi.advanceTimersByTimeAsync(0);sockets[0].send(message())
  await vi.advanceTimersByTimeAsync(16000);expect(states.at(-1)?.status).toBe('stale')
  feed.stop();await vi.advanceTimersByTimeAsync(60000);expect(sockets).toHaveLength(1)
  const second=setup();second.sockets[0].onopen?.();await vi.advanceTimersByTimeAsync(0)
  second.sockets[0].send(message(start+2*width));expect(second.states.at(-1)?.status).toBe('stale');second.feed.stop()
})
it('never lets a late hydration response revive a disposed feed',async()=>{
  vi.useFakeTimers();vi.setSystemTime(now)
  let resolve!:(bars:ReturnType<typeof parseHistory>)=>void
  const socket=new Socket(), states:LiveState[]=[]
  const feed=new LiveFeed('BTCUSDT','1m',s=>states.push(s),{socket:()=>socket,load:()=>new Promise(r=>resolve=r)})
  feed.start();socket.onopen?.();feed.stop();const count=states.length
  resolve(parseHistory([row(start)],'1m'));await vi.advanceTimersByTimeAsync(0)
  expect(states).toHaveLength(count)
})
it('remains stale and retries when backfill fails',async()=>{
  const {feed,sockets,states,load}=setup(undefined,()=>Promise.reject(new Error('offline')));sockets[0].onopen?.()
  await vi.advanceTimersByTimeAsync(0);expect(states.at(-1)?.status).toBe('stale')
  await vi.advanceTimersByTimeAsync(1000);expect(sockets).toHaveLength(2);feed.stop()
})
it('times out stalled hydration even when the socket keeps sending',async()=>{
  const {feed,sockets,states}=setup(undefined,()=>new Promise(()=>{}));sockets[0].onopen?.()
  for(let i=0;i<16;i++) { sockets[0].send(message().replace(String(now),String(Date.now())));await vi.advanceTimersByTimeAsync(1000) }
  expect(states.at(-1)?.status).toBe('stale');feed.stop()
})
