import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,type ComponentProps} from 'react'
import {ChartPanel,CHART_COLORS,buildChartSettingsOptions,useChartPreferences,type IndicatorType} from '@dylanpersonguy/opencharts'
import {createChart,CrosshairMode,LineStyle,type IChartApi,type ISeriesApi,type UTCTimestamp,type MouseEventParams,type Time} from 'lightweight-charts'
import {GearIcon,Cross2Icon,ArrowUpIcon,ArrowDownIcon} from '@radix-ui/react-icons'
import type {Bar} from '../api'
import {MINUTES,type Timeframe} from '../replay'
import {ChartBus,type ChartPort} from './chartBus'
import {AxisContextMenu,type AxisMenuState} from './AxisContextMenu'
import {barCloseCountdown,defaultStudy,isOscillator,lastCandleBodyColor,lastPriceBadgePlacement,nonOverlappingPriceLabelTop,normalizeStudy,priceBadgeTextColor,type SettingsMap,type StudySettings} from './studies'
import {studyData} from './studyData'
const emptyIndicators:IndicatorType[]=[]
const TRADINGVIEW_FONT_FAMILY='-apple-system, BlinkMacSystemFont, "Trebuchet MS", Roboto, Ubuntu, sans-serif'
const style=(s:StudySettings)=>s.style==='solid'?LineStyle.Solid:s.style==='dotted'?LineStyle.Dotted:LineStyle.Dashed
const data=(points:{time:number;value:number;color?:string}[])=>points.map(p=>({...p,time:p.time as UTCTimestamp}))
function oscillatorChartOptions(prefs:ReturnType<typeof useChartPreferences>,timeframe:Timeframe,bottom:boolean){
 const options=buildChartSettingsOptions(prefs,CHART_COLORS.dark,timeframe)
 return {...options,
  layout:{...options.layout,fontFamily:TRADINGVIEW_FONT_FAMILY},
  grid:{vertLines:{style:LineStyle.Dotted,...options.grid?.vertLines},horzLines:{style:LineStyle.Dotted,...options.grid?.horzLines}},
  crosshair:{mode:CrosshairMode.Normal,...options.crosshair},
  leftPriceScale:{minimumWidth:80,borderColor:'#292929',scaleMargins:{top:prefs.priceScaleTopMargin,bottom:prefs.priceScaleBottomMargin},...options.leftPriceScale},
  rightPriceScale:{minimumWidth:80,borderColor:'#292929',scaleMargins:{top:prefs.priceScaleTopMargin,bottom:prefs.priceScaleBottomMargin},...options.rightPriceScale},
  timeScale:{timeVisible:true,borderColor:'#292929',minBarSpacing:.5,...options.timeScale,visible:prefs.showTimeScale&&bottom},
 }
}
type Main={chart:IChartApi;series:ISeriesApi<'Candlestick'>}
type RelocatedAxisLabel={index:number;text:string;color:string;name:string;left:number;top:number;width:number}
type Props={cell:string;bars:Bar[];bus:ChartBus;settings:SettingsMap;active:IndicatorType[];onSettings:(type:IndicatorType,v:StudySettings)=>void;onEdit:(type:IndicatorType)=>void;onRemove:(type:IndicatorType)=>void;onOpenSettings:()=>void;drawingRailHost:HTMLDivElement|null;panel:ComponentProps<typeof ChartPanel>}
export function StudyWorkspace({cell,bars,bus,settings,active,onSettings,onEdit,onRemove,onOpenSettings,drawingRailHost,panel}:Props){
 const [hoverTime,setHoverTime]=useState<number|null>(null)
 const [main,setMain]=useState<Main|null>(null),[height,setHeight]=useState(0);const workspace=useRef<HTMLDivElement>(null)
 const [axisMenu,setAxisMenu]=useState<AxisMenuState|null>(null),axisMenuId=useRef(0)
 const prefs=useChartPreferences()
 useEffect(()=>{const el=workspace.current;if(!el)return;const observer=new ResizeObserver(()=>setHeight(el.clientHeight));observer.observe(el);return()=>observer.disconnect()},[])
 const barRef=useRef(bars);barRef.current=bars
 const ready=useCallback((m:Main|null)=>{bus.remove(cell+':price');if(m){m.chart.applyOptions({crosshair:{mode:CrosshairMode.Normal},layout:{fontFamily:TRADINGVIEW_FONT_FAMILY}});const b=barRef.current;bus.add({onHover:setHoverTime,id:cell+':price',cell,...m,times:b.map(v=>v.time/1000),values:new Map(b.map(v=>[v.time/1000,v.close])),width:MINUTES[panel.timeframe as Timeframe]*60})}setMain(m)},[bus,cell,panel.timeframe])
 const resolved=useMemo(()=>Object.fromEntries(active.map(t=>[t,normalizeStudy(t,settings[t]??defaultStudy(t))])) as Record<IndicatorType,StudySettings>,[active,settings])
 const visibleActive=useMemo(()=>active.filter(type=>resolved[type].visibleTimeframes.includes(panel.timeframe as Timeframe)),[active,resolved,panel.timeframe])
 const osc=visibleActive.filter(isOscillator),above=osc.filter(t=>resolved[t].placement==='above'),below=osc.filter(t=>resolved[t].placement!=='above'),last=below.at(-1)??'price'
 useEffect(()=>{if(!main)return;const hover=(p:MouseEventParams<Time>)=>setHoverTime(p.point&&typeof p.time==='number'?p.time:null);main.chart.subscribeCrosshairMove(hover);return()=>{try{main.chart.unsubscribeCrosshairMove(hover)}catch{/* Disposed chart. */}}},[main])
 useLayoutEffect(()=>{bus.update(cell+':price',bars.map(b=>b.time/1000),new Map(bars.map(b=>[b.time/1000,b.close])))},[bus,cell,bars])
 useEffect(()=>{main?.chart.applyOptions({layout:{fontFamily:TRADINGVIEW_FONT_FAMILY}})},[main,prefs])
 useEffect(()=>{main?.chart.applyOptions({timeScale:{visible:prefs.showTimeScale&&last==='price'}})},[main,last,prefs.showTimeScale])
 useEffect(()=>{for(const line of overlaySeries.current)line.applyOptions({priceScaleId:prefs.priceScaleSide})},[main,prefs.priceScaleSide])
 useEffect(()=>{
  const chart=main?.chart,element=chart?.chartElement()
  if(!chart||!element)return
  const handleContextMenu=(event:MouseEvent)=>{
   const target=event.target instanceof Element?event.target:null
   const table=element.querySelector('table'),row=target?.closest('tr'),cell=target?.closest('td')
   const rows=table?Array.from(table.rows):[]
   if(!target||!row||!cell||!table?.contains(row))return
   const timeRow=rows.at(-1)
   const inTimeScale=prefs.showTimeScale&&chart.timeScale().height()>0&&row===timeRow
   const priceRow=rows[0]
   const cells=priceRow?Array.from(priceRow.cells):[]
   const priceCell=prefs.priceScaleSide==='right'?cells.at(-1):cells[0]
   const inPriceScale=prefs.showPriceScale&&chart.priceScale(prefs.priceScaleSide).width()>0&&row===priceRow&&cell===priceCell
   if(!inTimeScale&&!inPriceScale)return
   event.preventDefault();event.stopPropagation()
   setAxisMenu({id:++axisMenuId.current,kind:inTimeScale?'time':'price',x:event.clientX,y:event.clientY,returnFocus:document.activeElement instanceof HTMLElement?document.activeElement:null})
  }
  element.addEventListener('contextmenu',handleContextMenu,true)
  return()=>element.removeEventListener('contextmenu',handleContextMenu,true)
 },[main,prefs.priceScaleSide,prefs.showPriceScale,prefs.showTimeScale])
 const closeAxisMenu=useCallback((restoreFocus:boolean)=>{
  const target=axisMenu?.returnFocus
  setAxisMenu(null)
  if(restoreFocus&&target?.isConnected)requestAnimationFrame(()=>target.focus({preventScroll:true}))
 },[axisMenu])
 const overlays=useMemo(()=>visibleActive.filter(t=>!isOscillator(t)),[visibleActive]);const overlaySeries=useRef<ISeriesApi<'Line'>[]>([])
 const computed=useMemo(()=>Object.fromEntries(overlays.map(t=>[t,studyData(bars,t,resolved[t])])),[bars,overlays,resolved])
 // Use the same chart instance and native indicator calculations, with user inputs/styles.
 useEffect(()=>{
  if(!main)return
  const series:ISeriesApi<'Line'>[]=[]
  for(const type of overlays)for(const l of studyData(barRef.current,type,resolved[type]).lines){const line=main.chart.addLineSeries({priceScaleId:prefs.priceScaleSide,color:l.color,lineWidth:resolved[type].width,lineStyle:style(resolved[type]),lineVisible:resolved[type].lineVisible,priceLineVisible:false,lastValueVisible:resolved[type].showPriceLabel,crosshairMarkerVisible:false});series.push(line)}
  overlaySeries.current=series
  return()=>{overlaySeries.current=[];for(const line of series){try{main.chart.removeSeries(line)}catch{/* Main chart may already be disposed on a theme change. */}}}
 },[main,overlays,resolved])
 useEffect(()=>{let i=0;for(const type of overlays)for(const line of computed[type].lines)overlaySeries.current[i++]?.setData(data(line.data))},[main,computed,overlays,resolved])
 const total=osc.reduce((sum,t)=>sum+resolved[t].height,0),budget=height?Math.min(total,Math.max(72*osc.length,Math.max(height*.52,height-220))):total
 function pane(type:IndicatorType){return <OscillatorPane renderedHeight={total?Math.max(72,Math.round(resolved[type].height*budget/total)):170} key={type} cell={cell} type={type} bars={bars} settings={resolved[type]} bus={bus} timeframe={panel.timeframe as Timeframe} bottom={last===type} onSettings={v=>onSettings(type,v)} onEdit={()=>onEdit(type)} onRemove={()=>onRemove(type)}/>}
 return <div ref={workspace} className="study-workspace">
  {above.map(pane)}
  <div className="price-pane" key="price"><ChartPanel {...panel} drawingRailHost={drawingRailHost} activeIndicators={emptyIndicators} onChartReady={ready}/>
   <BarCloseCountdown timeframe={panel.timeframe as Timeframe} chart={main?.chart??null} series={main?.series??null} otherSeries={overlaySeries} last={bars.at(-1)} previous={bars.at(-2)}/>
   <div className="overlay-legends">{overlays.map(t=><StudyLegend key={t} type={t} settings={resolved[t]} values={computed[t].lines.map(l=>hoverTime===null?l.data.at(-1)?.value:l.data.find(p=>p.time===hoverTime)?.value)} showTitle={prefs.showStatusLineStudyTitle} showInputs={prefs.showStatusLineStudyInputs&&resolved[t].showStatusLineInputs} showValues={prefs.showStatusLineStudyValues&&resolved[t].showStatusLineValues} showBackground={prefs.showStatusLineStudyBackground} onEdit={()=>onEdit(t)} onRemove={()=>onRemove(t)}/>)}</div>
  </div>
  {below.map(pane)}
  {axisMenu&&main?<AxisContextMenu key={axisMenu.id} menu={axisMenu} chart={main.chart} prefs={prefs} onOpenSettings={onOpenSettings} onClose={closeAxisMenu}/>:null}
 </div>
}
function BarCloseCountdown({timeframe,chart,series,otherSeries,last,previous}:{timeframe:Timeframe;chart:IChartApi|null;series:ISeriesApi<'Candlestick'>|null;otherSeries:{current:ISeriesApi<'Line'>[]};last:Bar|undefined;previous:Bar|undefined}){
 const prefs=useChartPreferences()
 const [countdown,setCountdown]=useState(''),[relocatedLabels,setRelocatedLabels]=useState<RelocatedAxisLabel[]>([]),badge=useRef<HTMLDivElement>(null)
 const hiddenOtherLabels=useRef(new Map<ISeriesApi<'Line'>,boolean>())
 const lastRef=useRef(last);lastRef.current=last
 const prefsRef=useRef(prefs);prefsRef.current=prefs
 const color=last?(series?.options().priceLineColor||lastCandleBodyColor(last,previous,prefs,{up:CHART_COLORS.dark.up,down:CHART_COLORS.dark.down})):CHART_COLORS.dark.down
 const colorRef=useRef(color);colorRef.current=color
 const restoreHiddenLabels=()=>{
  for(const [line,visible] of hiddenOtherLabels.current)try{line.applyOptions({lastValueVisible:visible})}catch{/* The chart is being disposed. */}
  hiddenOtherLabels.current.clear()
 }
 useEffect(()=>{
  if(!prefs.showCountdown){setCountdown('');return}
  const tick=()=>setCountdown(barCloseCountdown(Date.now(),timeframe))
  tick();const id=setInterval(tick,1000)
  return()=>clearInterval(id)
 },[prefs.showCountdown,timeframe])
 useEffect(()=>{
  if(!series)return
  try{series.applyOptions({lastValueVisible:prefs.showLastValue&&!prefs.showCountdown})}catch{/* The chart is being disposed. */}
  return()=>{try{series.applyOptions({lastValueVisible:prefs.showLastValue})}catch{/* The chart is being disposed. */}}
 },[series,prefs.showLastValue,prefs.showCountdown])
 useEffect(()=>{
  if(!prefs.showCountdown||!prefs.showPriceScale||!chart||!series||!lastRef.current)return
  let frame=0,cancelled=false
  const updatePosition=()=>{
   const node=badge.current,bar=lastRef.current
   if(node&&bar){
    try{
     const chartElement=chart.chartElement(),pricePane=chartElement.closest('.price-pane')
     const valueY=series.priceToCoordinate(bar.close)
     const side=prefsRef.current.priceScaleSide,scaleWidth=chart.priceScale(side).width()
     const paneHeight=chart.paneSize().height
     const position=valueY===null?null:lastPriceBadgePlacement(valueY,paneHeight,scaleWidth,prefsRef.current.showLastValue)
     if(position&&pricePane){
      const paneRect=pricePane.getBoundingClientRect(),chartRect=chartElement.getBoundingClientRect()
      const left=chartRect.left-paneRect.left+(side==='right'?chartElement.clientWidth-scaleWidth:0)
      const top=chartRect.top-paneRect.top+position.top
      const badgeHeight=(prefsRef.current.showLastValue?32:0)+16,badgeTop=position.top,badgeBottom=badgeTop+badgeHeight
      const occupied:[number,number][]=[]
      if(prefsRef.current.noOverlappingLabels)occupied.push([badgeTop,badgeBottom])
      const candidates=otherSeries.current.flatMap((candidate,index)=>{
       const savedVisibility=hiddenOtherLabels.current.get(candidate),visible=savedVisibility??candidate.options().lastValueVisible
       if(!visible)return []
       const latest=candidate.data().at(-1)
       if(!latest||!('value' in latest))return []
       const labelY=candidate.priceToCoordinate(latest.value)
       if(labelY===null)return []
       const collides=!!position&&prefsRef.current.noOverlappingLabels&&labelY+11>badgeTop&&labelY-11<badgeBottom
       if(!collides)occupied.push([labelY-9,labelY+9])
       const labelColor=candidate.options().priceLineColor||candidate.options().color
       return [{candidate,index,labelY,collides,text:candidate.priceFormatter().format(latest.value),color:labelColor,name:candidate.options().title||'Indicator'}]
      })
      const nextHidden=new Map<ISeriesApi<'Line'>,boolean>(),nextLabels:RelocatedAxisLabel[]=[]
      for(const item of candidates){
       if(!item.collides)continue
       const visible=hiddenOtherLabels.current.get(item.candidate)??item.candidate.options().lastValueVisible
       nextHidden.set(item.candidate,visible)
       const relocatedTop=nonOverlappingPriceLabelTop(item.labelY,paneHeight,18,occupied,item.labelY>=valueY!)
       if(relocatedTop!==null){nextLabels.push({index:item.index,text:item.text,color:item.color,name:item.name,left,top:chartRect.top-paneRect.top+relocatedTop,width:scaleWidth});occupied.push([relocatedTop,relocatedTop+18])}
      }
      for(const [line,visible] of hiddenOtherLabels.current)if(!nextHidden.has(line))try{line.applyOptions({lastValueVisible:visible})}catch{/* The series was removed. */}
      for(const line of nextHidden.keys())if(!hiddenOtherLabels.current.has(line))try{line.applyOptions({lastValueVisible:false})}catch{/* The series was removed. */}
      hiddenOtherLabels.current=nextHidden
      setRelocatedLabels(current=>current.length===nextLabels.length&&nextLabels.every((next,index)=>{
       const prior=current[index]
       return prior?.index===next.index&&prior.text===next.text&&prior.color===next.color&&Math.abs(prior.left-next.left)<.5&&Math.abs(prior.top-next.top)<.5&&prior.width===next.width
      })?current:nextLabels)
      node.style.width=`${position.width}px`
      node.style.transform=`translate3d(${left}px,${top}px,0)`
      node.style.backgroundColor=colorRef.current
      node.style.color=priceBadgeTextColor(colorRef.current)
      node.style.visibility='visible'
     }else{node.style.visibility='hidden';restoreHiddenLabels();setRelocatedLabels(current=>current.length?[]:current)}
    }catch{/* The chart is being disposed. */}
   }else setRelocatedLabels(current=>current.length?[]:current)
   if(!cancelled)frame=requestAnimationFrame(updatePosition)
  }
  frame=requestAnimationFrame(updatePosition)
  return()=>{cancelled=true;cancelAnimationFrame(frame);restoreHiddenLabels()}
 },[prefs.showCountdown,prefs.showPriceScale,prefs.showLastValue,prefs.noOverlappingLabels,prefs.priceScaleSide,chart,series,last?.time])
 if(!prefs.showCountdown||!prefs.showPriceScale||!series||!last)return null
 const price=series.priceFormatter().format(last.close)
 return <>
  <div ref={badge} className="last-price-badge" role="img" aria-label={prefs.showLastValue?`${price}, ${countdown} remaining`:`${countdown} remaining`}>
   {prefs.showLastValue?<span className="last-price-badge__price">{price}</span>:null}
   <span className="last-price-badge__countdown">{countdown}</span>
  </div>
  {relocatedLabels.map(label=><div key={label.index} className="indicator-price-badge" role="img" aria-label={`${label.name} ${label.text}`} style={{width:label.width,transform:`translate3d(${label.left}px,${label.top}px,0)`,backgroundColor:label.color,color:priceBadgeTextColor(label.color)}}>{label.text}</div>)}
 </>
}
function StudyLegend({type,settings:s,values,showTitle,showInputs,showValues,showBackground,onEdit,onRemove,onMove}:{type:IndicatorType;settings:StudySettings;values:(number|undefined)[];showTitle:boolean;showInputs:boolean;showValues:boolean;showBackground:boolean;onEdit:()=>void;onRemove:()=>void;onMove?:()=>void}){
 const params=type==='MACD'?`${s.fast} ${s.slow} ${s.signal}`:type==='VWAP'?'UTC · loaded bars':`${s.period}${type==='RSI'?` · SMA ${s.smoothing}`:''}`
 return <div className={`study-legend${showBackground?'':' study-legend--transparent'}`} onDoubleClick={onEdit}>{showTitle?<span className="study-legend-title">{type}</span>:null}{showInputs?<span className="study-legend-inputs">{params}</span>:null}{showValues?<span className="study-legend-values">{values.map((v,i)=><span key={i} style={{color:i===2?(v!==undefined&&v>=0?'#26a69a':'#ef5350'):i?s.secondaryColor:s.color}}>{v===undefined?'—':v.toFixed(2)}</span>)}</span>:null}<button aria-label={`${type} settings`} title="Settings" onClick={onEdit}><GearIcon/></button>{onMove?<button aria-label={`Move ${type} ${s.placement==='above'?'below':'above'} price`} title={s.placement==='above'?'Move below price':'Move above price'} onClick={onMove}>{s.placement==='above'?<ArrowDownIcon/>:<ArrowUpIcon/>}</button>:null}<button aria-label={`Remove ${type}`} title="Remove" onClick={onRemove}><Cross2Icon/></button></div>
}
function OscillatorPane({renderedHeight,cell,type,bars,settings:s,bus,timeframe,bottom,onSettings,onEdit,onRemove}:{renderedHeight:number;cell:string;type:IndicatorType;bars:Bar[];settings:StudySettings;bus:ChartBus;timeframe:Timeframe;bottom:boolean;onSettings:(v:StudySettings)=>void;onEdit:()=>void;onRemove:()=>void}){
 const host=useRef<HTMLDivElement>(null),chartRef=useRef<IChartApi|null>(null),series=useRef<ISeriesApi<'Line'>[]>([]),hist=useRef<ISeriesApi<'Histogram'>|null>(null),anchor=useRef<ISeriesApi<'Line'>|null>(null),port=useRef<ChartPort|null>(null)
 const [hoverTime,setHoverTime]=useState<number|null>(null)
 const [band,setBand]=useState<{top:number;height:number;right:number}|null>(null)
 const prefs=useChartPreferences(),computed=useMemo(()=>studyData(bars,type,s),[bars,type,s])
 const updateBand=useCallback(()=>{const primary=series.current[0],chart=chartRef.current;if((type!=='RSI'&&type!=='STOCH')||!primary||!chart)return;const hi=primary.priceToCoordinate(type==='RSI'?70:80),lo=primary.priceToCoordinate(type==='RSI'?30:20);if(hi!==null&&lo!==null)setBand({top:hi,height:lo-hi,right:chart.priceScale(prefs.priceScaleSide).width()})},[type,prefs.priceScaleSide])
 useEffect(()=>{
  if(!host.current)return
 const chart=createChart(host.current,{autoSize:true,...oscillatorChartOptions(prefs,timeframe,bottom)})
  chartRef.current=chart
  anchor.current=chart.addLineSeries({priceScaleId:'anchor',lineVisible:false,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});chart.priceScale('anchor').applyOptions({visible:false})
  if(type==='MACD')hist.current=chart.addHistogramSeries({priceLineVisible:false,lastValueVisible:s.showPriceLabel,visible:s.lineVisible})
  series.current=computed.lines.map(l=>chart.addLineSeries({color:l.color,lineWidth:s.width,lineStyle:style(s),lineVisible:s.lineVisible,priceLineVisible:false,lastValueVisible:s.showPriceLabel,crosshairMarkerVisible:true,...(['RSI','STOCH'].includes(type)?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})}))
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
 // Appearance updates are applied below; rebuilding here would discard the pane viewport.
 },[cell,type,bus,timeframe])
 useEffect(()=>{const chart=chartRef.current;if(!chart)return;chart.applyOptions(oscillatorChartOptions(prefs,timeframe,bottom));for(const line of series.current)line.applyOptions({priceScaleId:prefs.priceScaleSide});updateBand()},[prefs,timeframe,bottom,updateBand])
 useEffect(()=>{if(!chartRef.current)return;anchor.current?.setData(bars.map(b=>({time:b.time/1000 as UTCTimestamp})));computed.lines.forEach((l,i)=>{series.current[i]?.applyOptions({color:l.color,lineWidth:s.width,lineStyle:style(s),lineVisible:s.lineVisible,lastValueVisible:s.showPriceLabel});series.current[i]?.setData(data(l.data))});hist.current?.applyOptions({visible:s.lineVisible,lastValueVisible:s.showPriceLabel});hist.current?.setData(data(computed.histogram));bus.update(cell+':'+type,bars.map(b=>b.time/1000),new Map(computed.lines[0].data.map(p=>[p.time,p.value])));updateBand()},[computed,bars,s,bus,cell,type,updateBand])
 const drag=useRef<{y:number;height:number}|null>(null)
 return <section className="oscillator-pane" aria-label={`${type} pane`} style={{height:renderedHeight}}>
  <div className="pane-divider" role="separator" aria-label={`Resize ${type} pane`} aria-orientation="horizontal" aria-valuemin={100} aria-valuemax={400} aria-valuenow={s.height} tabIndex={0} onPointerDown={e=>{drag.current={y:e.clientY,height:s.height};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)onSettings(normalizeStudy(type,{...s,height:drag.current.height+drag.current.y-e.clientY}))}} onPointerUp={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}} onKeyDown={e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();onSettings(normalizeStudy(type,{...s,height:s.height+(e.key==='ArrowUp'?10:-10)}))}}}/>
  <div ref={host} className="oscillator-canvas"/>
  {band?<div className="oscillator-band" style={band}/>:null}
  <div className="pane-legend"><StudyLegend type={type} settings={s} values={[...computed.lines.map(l=>hoverTime===null?l.data.at(-1)?.value:l.data.find(p=>p.time===hoverTime)?.value),...(type==='MACD'?[hoverTime===null?computed.histogram.at(-1)?.value:computed.histogram.find(p=>p.time===hoverTime)?.value]:[])]} showTitle={prefs.showStatusLineStudyTitle} showInputs={prefs.showStatusLineStudyInputs&&s.showStatusLineInputs} showValues={prefs.showStatusLineStudyValues&&s.showStatusLineValues} showBackground={prefs.showStatusLineStudyBackground} onEdit={onEdit} onRemove={onRemove} onMove={()=>onSettings({...s,placement:s.placement==='above'?'below':'above'})}/></div>
 </section>
}
