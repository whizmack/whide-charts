import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type ComponentProps} from 'react'
import {ChartPanel,useChartPreferences,type IndicatorType} from '@dylanpersonguy/opencharts'
import {createChart,ColorType,CrosshairMode,LineStyle,type IChartApi,type ISeriesApi,type UTCTimestamp,type MouseEventParams,type Time} from 'lightweight-charts'
import {GearIcon,Cross2Icon,ArrowUpIcon,ArrowDownIcon} from '@radix-ui/react-icons'
import type {Bar} from '../api'
import {MINUTES,type Timeframe} from '../replay'
import {ChartBus,type ChartPort} from './chartBus'
import {barCloseCountdown,defaultStudy,isOscillator,lastPriceBadgePlace,normalizeStudy,type SettingsMap,type StudySettings} from './studies'
import {studyData} from './studyData'
const emptyIndicators:IndicatorType[]=[]
const style=(s:StudySettings)=>s.style==='solid'?LineStyle.Solid:s.style==='dotted'?LineStyle.Dotted:LineStyle.Dashed
const data=(points:{time:number;value:number;color?:string}[])=>points.map(p=>({...p,time:p.time as UTCTimestamp}))
type Main={chart:IChartApi;series:ISeriesApi<'Candlestick'>}
type Props={cell:string;bars:Bar[];bus:ChartBus;settings:SettingsMap;active:IndicatorType[];onSettings:(type:IndicatorType,v:StudySettings)=>void;onEdit:(type:IndicatorType)=>void;onRemove:(type:IndicatorType)=>void;panel:ComponentProps<typeof ChartPanel>}
export function StudyWorkspace({cell,bars,bus,settings,active,onSettings,onEdit,onRemove,panel}:Props){
 const [hoverTime,setHoverTime]=useState<number|null>(null)
 const [main,setMain]=useState<Main|null>(null),[railHost,setRailHost]=useState<HTMLDivElement|null>(null),[height,setHeight]=useState(0);const workspace=useRef<HTMLDivElement>(null)
 useEffect(()=>{const el=workspace.current;if(!el)return;const observer=new ResizeObserver(()=>setHeight(el.clientHeight));observer.observe(el);return()=>observer.disconnect()},[])
 const barRef=useRef(bars);barRef.current=bars
 const ready=useCallback((m:Main|null)=>{bus.remove(cell+':price');if(m){m.chart.applyOptions({crosshair:{mode:CrosshairMode.Normal}});const b=barRef.current;bus.add({onHover:setHoverTime,id:cell+':price',cell,...m,times:b.map(v=>v.time/1000),values:new Map(b.map(v=>[v.time/1000,v.close])),width:MINUTES[panel.timeframe as Timeframe]*60})}setMain(m)},[bus,cell,panel.timeframe])
 const resolved=useMemo(()=>Object.fromEntries(active.map(t=>[t,normalizeStudy(t,settings[t]??defaultStudy(t))])) as Record<IndicatorType,StudySettings>,[active,settings])
 const osc=active.filter(isOscillator),above=osc.filter(t=>resolved[t].placement==='above'),below=osc.filter(t=>resolved[t].placement!=='above'),last=below.at(-1)??'price'
 useEffect(()=>{if(!main)return;const hover=(p:MouseEventParams<Time>)=>setHoverTime(p.point&&typeof p.time==='number'?p.time:null);main.chart.subscribeCrosshairMove(hover);return()=>{try{main.chart.unsubscribeCrosshairMove(hover)}catch{/* Disposed chart. */}}},[main])
 useLayoutEffect(()=>{bus.update(cell+':price',bars.map(b=>b.time/1000),new Map(bars.map(b=>[b.time/1000,b.close])))},[bus,cell,bars])
 useEffect(()=>{main?.chart.applyOptions({timeScale:{visible:last==='price'}})},[main,last])
 const overlays=useMemo(()=>active.filter(t=>!isOscillator(t)),[active]);const overlaySeries=useRef<ISeriesApi<'Line'>[]>([])
 const computed=useMemo(()=>Object.fromEntries(overlays.map(t=>[t,studyData(bars,t,resolved[t])])),[bars,active,resolved])
 // Use the same chart instance and native indicator calculations, with user inputs/styles.
 useEffect(()=>{
  if(!main)return
  const series:ISeriesApi<'Line'>[]=[]
  for(const type of overlays)for(const l of studyData(barRef.current,type,resolved[type]).lines){const line=main.chart.addLineSeries({color:l.color,lineWidth:resolved[type].width,lineStyle:style(resolved[type]),priceLineVisible:false,lastValueVisible:true,crosshairMarkerVisible:false});series.push(line)}
  overlaySeries.current=series
  return()=>{overlaySeries.current=[];for(const line of series){try{main.chart.removeSeries(line)}catch{/* Main chart may already be disposed on a theme change. */}}}
 },[main,overlays,resolved])
 useEffect(()=>{let i=0;for(const type of overlays)for(const line of computed[type].lines)overlaySeries.current[i++]?.setData(data(line.data))},[main,computed,overlays,resolved])
 const total=osc.reduce((sum,t)=>sum+resolved[t].height,0),budget=height?Math.min(total,Math.max(72*osc.length,Math.max(height*.52,height-220))):total
 function pane(type:IndicatorType){return <OscillatorPane renderedHeight={total?Math.max(72,Math.round(resolved[type].height*budget/total)):170} key={type} cell={cell} type={type} bars={bars} settings={resolved[type]} bus={bus} timeframe={panel.timeframe as Timeframe} bottom={last===type} onSettings={v=>onSettings(type,v)} onEdit={()=>onEdit(type)} onRemove={()=>onRemove(type)}/>}
 return <div ref={workspace} className="study-workspace">
  <div ref={setRailHost} className="drawing-rail-host"/>
  {above.map(pane)}
  <div className="price-pane" key="price"><ChartPanel {...panel} drawingRailHost={railHost} activeIndicators={emptyIndicators} onChartReady={ready}/>
   <BarCloseCountdown timeframe={panel.timeframe as Timeframe} chart={main?.chart??null} series={main?.series??null} last={bars.at(-1)}/>
   <div className="overlay-legends">{overlays.map(t=><StudyLegend key={t} type={t} settings={resolved[t]} values={computed[t].lines.map(l=>hoverTime===null?l.data.at(-1)?.value:l.data.find(p=>p.time===hoverTime)?.value)} onEdit={()=>onEdit(t)} onRemove={()=>onRemove(t)}/>)}</div>
  </div>
  {below.map(pane)}
 </div>
}
function BarCloseCountdown({timeframe,chart,series,last}:{timeframe:Timeframe;chart:IChartApi|null;series:ISeriesApi<'Candlestick'>|null;last:Bar|undefined}){
 const prefs=useChartPreferences()
 const [label,setLabel]=useState('')
 const [price,setPrice]=useState('')
 const [place,setPlace]=useState<{top:number;width:number}|null>(null)
 const lastRef=useRef(last);lastRef.current=last
 useEffect(()=>{
  if(!prefs.showCountdown){setLabel('');setPrice('');setPlace(null);try{series?.applyOptions({lastValueVisible:true})}catch{/* Disposed series. */}return}
  try{series?.applyOptions({lastValueVisible:false})}catch{/* Disposed series. */}
  const tick=()=>{
   setLabel(barCloseCountdown(Date.now(),timeframe))
   const bar=lastRef.current
   if(!chart||!series||bar===undefined){setPlace(null);setPrice('');return}
   setPrice(series.priceFormatter().format(bar.close))
   const plot=chart.chartElement().querySelector('table tr')
   setPlace(lastPriceBadgePlace(series.priceToCoordinate(bar.close),plot?.clientHeight??0,chart.priceScale('right').width()))
  }
  tick()
  const id=setInterval(tick,1000)
  const host=chart?.chartElement()
  const ro=host?new ResizeObserver(tick):null
  ro?.observe(host!)
  chart?.timeScale().subscribeVisibleLogicalRangeChange(tick)
  return()=>{clearInterval(id);ro?.disconnect();try{chart?.timeScale().unsubscribeVisibleLogicalRangeChange(tick);series?.applyOptions({lastValueVisible:true})}catch{/* Disposed chart. */}}
 },[prefs.showCountdown,timeframe,chart,series,last?.close])
 if(!prefs.showCountdown||!label||!place||!price)return null
 const up=last!==undefined&&last.close>=last.open
 return <div className="last-price-badge" style={{top:place.top,width:place.width,background:up?(prefs.candleUpColor||'#26a69a'):(prefs.candleDownColor||'#ef5350')}}>
  <div className="last-price">{price}</div>
  <div className="bar-countdown" aria-label="Countdown to bar close">{label}</div>
 </div>
}
function StudyLegend({type,settings:s,values,onEdit,onRemove,onMove}:{type:IndicatorType;settings:StudySettings;values:(number|undefined)[];onEdit:()=>void;onRemove:()=>void;onMove?:()=>void}){
 const params=type==='MACD'?`${s.fast} ${s.slow} ${s.signal}`:type==='VWAP'?'UTC · loaded bars':`${s.period}${type==='RSI'?` · SMA ${s.smoothing}`:''}`
 return <div className="study-legend" onDoubleClick={onEdit}><span>{type} {params}</span>{values.map((v,i)=><span key={i} style={{color:i===2?(v!==undefined&&v>=0?'#26a69a':'#ef5350'):i?s.secondaryColor:s.color}}>{v===undefined?'—':v.toFixed(2)}</span>)}<button aria-label={`${type} settings`} title="Settings" onClick={onEdit}><GearIcon/></button>{onMove?<button aria-label={`Move ${type} ${s.placement==='above'?'below':'above'} price`} title={s.placement==='above'?'Move below price':'Move above price'} onClick={onMove}>{s.placement==='above'?<ArrowDownIcon/>:<ArrowUpIcon/>}</button>:null}<button aria-label={`Remove ${type}`} title="Remove" onClick={onRemove}><Cross2Icon/></button></div>
}
function OscillatorPane({renderedHeight,cell,type,bars,settings:s,bus,timeframe,bottom,onSettings,onEdit,onRemove}:{renderedHeight:number;cell:string;type:IndicatorType;bars:Bar[];settings:StudySettings;bus:ChartBus;timeframe:Timeframe;bottom:boolean;onSettings:(v:StudySettings)=>void;onEdit:()=>void;onRemove:()=>void}){
 const host=useRef<HTMLDivElement>(null),chartRef=useRef<IChartApi|null>(null),series=useRef<ISeriesApi<'Line'>[]>([]),hist=useRef<ISeriesApi<'Histogram'>|null>(null),anchor=useRef<ISeriesApi<'Line'>|null>(null),port=useRef<ChartPort|null>(null)
 const [hoverTime,setHoverTime]=useState<number|null>(null)
 const [band,setBand]=useState<{top:number;height:number;right:number}|null>(null)
 const prefs=useChartPreferences(),computed=useMemo(()=>studyData(bars,type,s),[bars,type,s])
 const updateBand=useCallback(()=>{const primary=series.current[0],chart=chartRef.current;if((type!=='RSI'&&type!=='STOCH')||!primary||!chart)return;const hi=primary.priceToCoordinate(type==='RSI'?70:80),lo=primary.priceToCoordinate(type==='RSI'?30:20);if(hi!==null&&lo!==null)setBand({top:hi,height:lo-hi,right:chart.priceScale('right').width()})},[type])
 useEffect(()=>{
  if(!host.current)return
  const chart=createChart(host.current,{autoSize:true,layout:{background:{type:ColorType.Solid,color:prefs.colorBackground||'#101010'},textColor:prefs.colorScaleText||'#999da5',fontSize:11,fontFamily:'Geist, system-ui, sans-serif'},grid:{vertLines:{visible:prefs.showGrid,color:prefs.colorGrid||'#1b1b1b'},horzLines:{visible:prefs.showGrid,color:prefs.colorGrid||'#1b1b1b'}},crosshair:{mode:CrosshairMode.Normal,vertLine:{color:prefs.colorCrosshair||'#62656c',style:LineStyle.Dashed},horzLine:{color:prefs.colorCrosshair||'#62656c',style:LineStyle.Dashed}},rightPriceScale:{minimumWidth:80,borderColor:'#292929',scaleMargins:{top:.17,bottom:.12}},timeScale:{timeVisible:true,secondsVisible:false,borderColor:'#292929',rightOffset:6,minBarSpacing:.5,visible:bottom}})
  chartRef.current=chart
  anchor.current=chart.addLineSeries({priceScaleId:'anchor',lineVisible:false,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});chart.priceScale('anchor').applyOptions({visible:false})
  if(type==='MACD')hist.current=chart.addHistogramSeries({priceLineVisible:false,lastValueVisible:true})
  series.current=computed.lines.map(l=>chart.addLineSeries({color:l.color,lineWidth:s.width,lineStyle:style(s),priceLineVisible:false,lastValueVisible:true,crosshairMarkerVisible:true,...(['RSI','STOCH'].includes(type)?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})}))
  if(['RSI','STOCH'].includes(type))for(const price of type==='RSI'?[30,50,70]:[20,50,80])series.current[0].createPriceLine({price,color:price===50?'#44434c':'#777180',lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title:''})
  if(type==='MACD')series.current[0].createPriceLine({price:0,color:'#656970',lineWidth:1,lineStyle:LineStyle.Dashed,axisLabelVisible:false,title:''})
  const p:ChartPort={onHover:setHoverTime,id:cell+':'+type,cell,chart,series:series.current[0],times:bars.map(b=>b.time/1000),values:new Map(computed.lines[0].data.map(p=>[p.time,p.value])),width:MINUTES[timeframe]*60};port.current=p
  // Anchor every bar, including indicator warmup, to match price's logical indices.
  anchor.current.setData(bars.map(b=>({time:b.time/1000 as UTCTimestamp})))
  computed.lines.forEach((l,i)=>series.current[i].setData(data(l.data)));hist.current?.setData(data(computed.histogram))
  bus.add(p)
  const hover=(event:MouseEventParams<Time>)=>setHoverTime(event.point&&typeof event.time==='number'?event.time:null);chart.subscribeCrosshairMove(hover)
  const resize=new ResizeObserver(()=>requestAnimationFrame(updateBand));resize.observe(host.current);chart.timeScale().subscribeVisibleLogicalRangeChange(updateBand)
  updateBand()
  return()=>{resize.disconnect();bus.remove(p.id);chart.timeScale().unsubscribeVisibleLogicalRangeChange(updateBand);chart.unsubscribeCrosshairMove(hover);chart.remove();chartRef.current=null;series.current=[];hist.current=null;anchor.current=null;port.current=null}
 },[cell,type,bus,timeframe,prefs.colorBackground,prefs.colorGrid,prefs.colorScaleText,prefs.colorCrosshair,prefs.showGrid])
 useEffect(()=>{chartRef.current?.applyOptions({timeScale:{visible:bottom}})},[bottom])
 useEffect(()=>{if(!chartRef.current)return;anchor.current?.setData(bars.map(b=>({time:b.time/1000 as UTCTimestamp})));computed.lines.forEach((l,i)=>{series.current[i]?.applyOptions({color:l.color,lineWidth:s.width,lineStyle:style(s)});series.current[i]?.setData(data(l.data))});hist.current?.setData(data(computed.histogram));bus.update(cell+':'+type,bars.map(b=>b.time/1000),new Map(computed.lines[0].data.map(p=>[p.time,p.value])));updateBand()},[computed,bars,s,bus,cell,type,updateBand])
 const drag=useRef<{y:number;height:number}|null>(null)
 return <section className="oscillator-pane" aria-label={`${type} pane`} style={{height:renderedHeight}}>
  <div className="pane-divider" role="separator" aria-label={`Resize ${type} pane`} aria-orientation="horizontal" aria-valuemin={100} aria-valuemax={400} aria-valuenow={s.height} tabIndex={0} onPointerDown={e=>{drag.current={y:e.clientY,height:s.height};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)onSettings(normalizeStudy(type,{...s,height:drag.current.height+drag.current.y-e.clientY}))}} onPointerUp={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();onSettings(normalizeStudy(type,{...s,height:s.height+(e.key==='ArrowUp'?10:-10)}))}}}/>
  <div ref={host} className="oscillator-canvas"/>
  {band?<div className="oscillator-band" style={band}/>:null}
  <div className="pane-legend"><StudyLegend type={type} settings={s} values={[...computed.lines.map(l=>hoverTime===null?l.data.at(-1)?.value:l.data.find(p=>p.time===hoverTime)?.value),...(type==='MACD'?[hoverTime===null?computed.histogram.at(-1)?.value:computed.histogram.find(p=>p.time===hoverTime)?.value]:[])]} onEdit={onEdit} onRemove={onRemove} onMove={()=>onSettings({...s,placement:s.placement==='above'?'below':'above'})}/></div>
 </section>
}
