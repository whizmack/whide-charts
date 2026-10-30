import { expect, it, vi } from 'vitest'
import type { Candle } from '@dylanpersonguy/opencharts'
import { previewAdapter } from './adapter'
import type { CandleRequest } from '@dylanpersonguy/opencharts'

const emptyFrame={symbol:'',timeframe:'',bars:[]}
const request:CandleRequest={symbol:'BTCUSDT',timeframe:'1m',limit:500,fromMs:1_000_000,toMs:31_000_000}

it('loads bounded older candle pages only while Live is active',async()=>{
 const bars=[{time:1_020,open:1,high:2,low:1,close:2,volume:3}] satisfies Candle[]
 const load=vi.fn(async()=>bars)
 let live=true
 const adapter=previewAdapter(()=>emptyFrame,()=>live,load)
 await expect(adapter.marketData.getCandles(request)).resolves.toEqual(bars)
 expect(load).toHaveBeenCalledWith(request)

 live=false
 await expect(adapter.marketData.getCandles(request)).resolves.toEqual([])
 expect(load).toHaveBeenCalledOnce()
})

it('does not request exchange history when a chart asks without a bounded range',async()=>{
 const load=vi.fn(async()=>[] as Candle[])
 const adapter=previewAdapter(()=>emptyFrame,()=>true,load)
 await expect(adapter.marketData.getCandles({symbol:'BTCUSDT',timeframe:'1m'})).resolves.toEqual([])
 expect(load).not.toHaveBeenCalled()
})
