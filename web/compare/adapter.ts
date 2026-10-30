import type { Candle,CandleRequest,OpenChartsAdapter,Symbol } from '@dylanpersonguy/opencharts'
import { chartWindow, type Frame } from './data'
import {TIMEFRAMES,type Timeframe,type Symbol as MarketSymbol} from '../replay'
const SYMBOLS=['BTCUSDT','ETHUSDT','SOLUSDT'] as const satisfies readonly MarketSymbol[]
type LiveHistoryLoader=(request:CandleRequest)=>Promise<Candle[]>
export function previewAdapter(read:()=>Frame,isLive:()=>boolean=()=>false,loadOlder?:LiveHistoryLoader):OpenChartsAdapter {
  return {
    name:'Whide Charts · controlled preview',
    marketData:{
      getSymbols:async()=>SYMBOLS.map(name=>({id:name,name,displayName:name,category:'CRYPTO',contractSize:1,tickSize:name==='SOLUSDT'?0.001:0.01,tickValue:0.01,marginPercent:100,maxLeverage:1,commission:0,swapLong:0,swapShort:0,tradingHoursStart:null,tradingHoursEnd:null,isActive:true} satisfies Symbol)),
      getCandles:async request=>{
        const local=chartWindow(read(),request)
        if(local.length)return local
        if(!isLive()||!loadOlder||!SYMBOLS.includes(request.symbol as typeof SYMBOLS[number])||!TIMEFRAMES.includes(request.timeframe as Timeframe)||request.fromMs===undefined||request.toMs===undefined||request.toMs<=request.fromMs)return []
        return loadOlder(request)
      },
      // The controlled ChartPanel receives our LiveFeed updates directly.
      subscribe:()=>()=>{},
    },
    storage:{get:key=>localStorage.getItem('opencharts-preview:'+key),set:(key,value)=>localStorage.setItem('opencharts-preview:'+key,value),remove:key=>localStorage.removeItem('opencharts-preview:'+key)},
  }
}
