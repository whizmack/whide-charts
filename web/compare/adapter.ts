import type { OpenChartsAdapter, Symbol } from '@dylanpersonguy/opencharts'
import { chartWindow, type Frame } from './data'
export function previewAdapter(read:()=>Frame):OpenChartsAdapter {
  return {
    name:'Whide Charts · controlled preview',
    marketData:{
      getSymbols:async()=>['BTCUSDT','ETHUSDT','SOLUSDT'].map(name=>({id:name,name,displayName:name,category:'CRYPTO',contractSize:1,tickSize:name==='SOLUSDT'?0.001:0.01,tickValue:0.01,marginPercent:100,maxLeverage:1,commission:0,swapLong:0,swapShort:0,tradingHoursStart:null,tradingHoursEnd:null,isActive:true} satisfies Symbol)),
      getCandles:async request=>chartWindow(read(),request),
      // The controlled ChartPanel receives our LiveFeed updates directly.
      subscribe:()=>()=>{},
    },
    storage:{get:key=>localStorage.getItem('opencharts-preview:'+key),set:(key,value)=>localStorage.setItem('opencharts-preview:'+key,value),remove:key=>localStorage.removeItem('opencharts-preview:'+key)},
  }
}
