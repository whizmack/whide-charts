import type {IChartApi,ISeriesApi,Time,LogicalRange,UTCTimestamp,MouseEventParams} from 'lightweight-charts'
import {logicalAt,timeAt} from './workspace'
export type ChartPort={id:string;cell:string;chart:IChartApi;series:ISeriesApi<'Candlestick'>|ISeriesApi<'Line'>;times:number[];values:Map<number,number>;width:number;onHover?:(time:number|null)=>void}
/** One bus for panes and chart cells. Values are mapped by time, never copied across symbols. */
export class ChartBus{
 private ports=new Map<string,ChartPort>();private cleanups=new Map<string,()=>void>();private crossing=false;private aligning=false
 private pointer:string|null=null;private horz=new Map<string,boolean>()
 private views:Record<string,{from:number;to:number}>;private saveTimer?:ReturnType<typeof setTimeout>
 constructor(views:Record<string,{from:number;to:number}>={},private save?:(views:Record<string,{from:number;to:number}>)=>void){this.views=views}
 syncTime=false;syncCrosshair=true
 add(port:ChartPort){
  this.remove(port.id);this.ports.set(port.id,port);const saved=this.views[port.cell]
  const range=(r:LogicalRange|null)=>{
   if(!r||!port.times.length)return
   if(port.id.endsWith(':price')){this.views[port.cell]={from:timeAt(port.times,r.from,port.width),to:timeAt(port.times,r.to,port.width)};clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.save?.({...this.views}),250)}
   this.alignScales(port.cell)
   for(const target of this.ports.values()){
    if(target===port||(!this.syncTime&&target.cell!==port.cell)||!target.times.length)continue
    const next=target.cell===port.cell?r:{from:logicalAt(target.times,timeAt(port.times,r.from,port.width),target.width),to:logicalAt(target.times,timeAt(port.times,r.to,port.width),target.width)}
    const current=target.chart.timeScale().getVisibleLogicalRange()
    if(!current||Math.abs(current.from-next.from)>0.01||Math.abs(current.to-next.to)>0.01)target.chart.timeScale().setVisibleLogicalRange(next)
   }
  }
  const cross=(p:MouseEventParams<Time>)=>{
   if(this.crossing)return
   // Followers replay the last crosshair after scale and data changes, with no pointer.
   // Treating that as a hover makes every pane chase a different bar.
   if(!p.point){if(this.pointer!==null&&this.pointer!==port.id)return;this.pointer=null}
   else if(p.sourceEvent)this.pointer=port.id
   else if(this.pointer!==port.id)return
   this.crossing=true
   port.onHover?.(p.point&&typeof p.time==='number'?p.time:null)
   try{
    const active=this.pointer===port.id
    this.setHorz(port,true)
    for(const target of this.ports.values()){
     if(target===port||(!this.syncCrosshair&&target.cell!==port.cell))continue
     const sourceTime=typeof p.time==='number'?p.time:undefined
     const index=sourceTime===undefined?-1:Math.floor(logicalAt(target.times,sourceTime,target.width))
     const time=target.times[index],value=time===undefined||sourceTime===undefined||sourceTime-time>=target.width?undefined:target.values.get(time)
     if(active&&p.point&&time!==undefined&&value!==undefined){this.setHorz(target,false);target.chart.setCrosshairPosition(value,time as UTCTimestamp,target.series);target.onHover?.(time)}
     else{this.setHorz(target,true);target.chart.clearCrosshairPosition();target.onHover?.(null)}
    }
    if(active)this.alignScales(port.cell)
   }finally{this.crossing=false}
  }
  port.chart.timeScale().subscribeVisibleLogicalRangeChange(range);port.chart.subscribeCrosshairMove(cross)
  this.cleanups.set(port.id,()=>{port.chart.timeScale().unsubscribeVisibleLogicalRangeChange(range);port.chart.unsubscribeCrosshairMove(cross)})
  const main=[...this.ports.values()].find(p=>p.cell===port.cell&&p.id.endsWith(':price'))
  if(main&&main!==port){const r=main.chart.timeScale().getVisibleLogicalRange();if(r)port.chart.timeScale().setVisibleLogicalRange(r)}
  if(saved&&port.id.endsWith(':price')&&typeof requestAnimationFrame!=='undefined')requestAnimationFrame(()=>{if(this.ports.get(port.id)!==port||!Number.isFinite(saved.from)||!Number.isFinite(saved.to)||saved.to<=saved.from)return;port.chart.timeScale().setVisibleLogicalRange({from:logicalAt(port.times,saved.from,port.width),to:logicalAt(port.times,saved.to,port.width)})})
  this.alignScales(port.cell)
 }
 /** One price-scale width per cell. A narrower pane shifts bars, so the crosshair jumps when the pointer crosses it. */
 private alignScales(cell:string){
  if(this.aligning)return
  const group=[...this.ports.values()].filter(p=>p.cell===cell)
  let width=0
  for(const p of group){const w=p.chart.priceScale('right').width();if(Number.isFinite(w)&&w>width)width=Math.ceil(w)}
  if(width<1)return
  this.aligning=true
  try{for(const p of group){const scale=p.chart.priceScale('right');if((scale.options().minimumWidth??0)!==width)scale.applyOptions({minimumWidth:width})}}finally{this.aligning=false}
 }
 private setHorz(port:ChartPort,visible:boolean){
  if(this.horz.get(port.id)===visible)return
  this.horz.set(port.id,visible)
  port.chart.applyOptions({crosshair:{horzLine:{visible}}})
 }
 update(id:string,times:number[],values:Map<number,number>){const p=this.ports.get(id);if(p){p.times=times;p.values=values}}
 remove(id:string){this.cleanups.get(id)?.();this.cleanups.delete(id);this.ports.delete(id);this.horz.delete(id);if(this.pointer===id)this.pointer=null}
 refresh(){const main=[...this.ports.values()].find(p=>p.id.endsWith(':price'));if(!main)return;const r=main.chart.timeScale().getVisibleLogicalRange();if(r)for(const p of this.ports.values()){if(p!==main&&this.syncTime&&p.times.length)p.chart.timeScale().setVisibleLogicalRange({from:logicalAt(p.times,timeAt(main.times,r.from,main.width),p.width),to:logicalAt(p.times,timeAt(main.times,r.to,main.width),p.width)})}}
}
