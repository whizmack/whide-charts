import {expect,it} from 'vitest'
import {ChartBus,type ChartPort} from './chartBus'
import type {LogicalRange,Time,MouseEventParams,IChartApi} from 'lightweight-charts'
function port(id:string,cell:string,times:number[],width:number,scaleWidth=0){
 let range={from:0,to:2} as LogicalRange;const ranges=new Set<(r:LogicalRange|null)=>void>(),cross=new Set<(p:MouseEventParams<Time>)=>void>();let marker:unknown=null,minimumWidth=0,horz=true
 const ts={getVisibleLogicalRange:()=>range,setVisibleLogicalRange:(r:LogicalRange)=>{range=r;for(const fn of ranges)fn(r)},subscribeVisibleLogicalRangeChange:(fn:typeof ranges extends Set<infer F>?F:never)=>ranges.add(fn),unsubscribeVisibleLogicalRangeChange:(fn:typeof ranges extends Set<infer F>?F:never)=>ranges.delete(fn)}
 const chart={timeScale:()=>ts,subscribeCrosshairMove:(fn:typeof cross extends Set<infer F>?F:never)=>cross.add(fn),unsubscribeCrosshairMove:(fn:typeof cross extends Set<infer F>?F:never)=>cross.delete(fn),setCrosshairPosition:(value:number,time:number)=>{marker={value,time}},clearCrosshairPosition:()=>{marker=null},applyOptions:(o:{crosshair?:{horzLine?:{visible?:boolean}}})=>{if(typeof o.crosshair?.horzLine?.visible==='boolean')horz=o.crosshair.horzLine.visible},priceScale:()=>({width:()=>Math.max(scaleWidth,minimumWidth),options:()=>({minimumWidth}),applyOptions:(o:{minimumWidth?:number})=>{if(typeof o.minimumWidth==='number')minimumWidth=o.minimumWidth}})}
 const emit=(p:MouseEventParams<Time>)=>{for(const fn of cross)fn(p)}
 return {p:{id,cell,chart:chart as unknown as IChartApi,series:{} as ChartPort['series'],times,width,values:new Map(times.map((t,i)=>[t,10+i]))},move:(r:LogicalRange)=>ts.setVisibleLogicalRange(r),hover:(time:number)=>emit({time,point:{x:1,y:1},sourceEvent:{}} as MouseEventParams<Time>),echo:(time:number)=>emit({time,point:{x:1,y:1}} as MouseEventParams<Time>),leave:()=>emit({} as MouseEventParams<Time>),range:()=>range,marker:()=>marker,scale:()=>minimumWidth,horz:()=>horz,subscriptions:()=>ranges.size+cross.size}
}
it('synchronizes subpanes, optionally links other timeframes, and cleans disposed ports',()=>{
 const bus=new ChartBus(),a=port('a:price','a',[0,300,600,900],300),rsi=port('a:rsi','a',[0,300,600,900],300),b=port('b:price','b',[0,3600,7200],3600)
 bus.add(a.p);bus.add(rsi.p);bus.add(b.p);a.move({from:1,to:3} as LogicalRange)
 expect(rsi.range()).toEqual({from:1,to:3});expect(b.range()).toEqual({from:0,to:2})
 bus.syncTime=true;a.move({from:0,to:2} as LogicalRange);expect(b.range().to).toBeCloseTo(1/6)
 bus.remove('b:price');expect(b.subscriptions()).toBe(0)
})
it('crosshair targets the containing higher candle and clears unavailable data',()=>{
 const bus=new ChartBus(),a=port('a:price','a',[0,300,600],300),b=port('b:price','b',[0,3600,10800],3600)
 bus.add(a.p);bus.add(b.p);a.hover(300);expect(b.marker()).toEqual({value:10,time:0})
 a.hover(8000);expect(b.marker()).toBe(null)
})
it('keeps one crosshair across panes when followers echo and price scales differ',()=>{
 const bus=new ChartBus(),price=port('a:price','a',[0,300,600],300,96),rsi=port('a:rsi','a',[0,300,600],300,48),macd=port('a:macd','a',[0,300,600],300,60)
 bus.add(price.p);bus.add(rsi.p);bus.add(macd.p)
 expect(price.scale()).toBe(96);expect(rsi.scale()).toBe(96);expect(macd.scale()).toBe(96)
 price.hover(300)
 expect(rsi.marker()).toEqual({value:11,time:300});expect(macd.marker()).toEqual({value:11,time:300})
 expect(price.horz()).toBe(true);expect(rsi.horz()).toBe(false);expect(macd.horz()).toBe(false)
 rsi.echo(600)
 expect(price.marker()).toBe(null);expect(macd.marker()).toEqual({value:11,time:300})
 price.echo(600)
 expect(rsi.marker()).toEqual({value:12,time:600});expect(macd.marker()).toEqual({value:12,time:600})
 price.leave()
 expect(rsi.marker()).toBe(null);expect(macd.marker()).toBe(null);expect(rsi.horz()).toBe(true)
})
