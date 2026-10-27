import {useEffect,useMemo,useRef,useState} from 'react'
import type {DrawingLine,DrawingTool,IndicatorType} from '@dylanpersonguy/opencharts'
import {StudyWorkspace} from './StudyWorkspace'
import {ChartBus} from './chartBus'
import {cellMessage,visibleDrawings} from './data'
import {loadBars,type Bar} from '../api'
import {LatestRequest} from '../replay'
import {subscribeLive} from './livePool'
import {effectiveMagnet,type Magnet,type StudySettings} from './studies'
import type {CellConfig} from './workspace'
import type {LiveState} from '../live'
import {activeDrawingRailHost} from './WorkspaceChrome'
export type SavedDrawing={asOf:number;drawing:DrawingLine}
export type DrawingStore=Record<string,SavedDrawing[]>
export type CellStatus={ready:boolean;error:string;health:LiveState['status'];updated:number|null;close:number|null}
export function ChartCell({config,mode,asOf,version,active,drawingRailHost,bus,reset,drawings,onDrawings,onStudy,onEdit,onRemove,onStatus,magnet,held,stay,onMagnet,onStay}:{config:CellConfig;mode:'live'|'replay';asOf:number;version:string;active:boolean;drawingRailHost:HTMLDivElement|null;bus:ChartBus;reset:number;drawings:DrawingStore;onDrawings:(key:string,d:SavedDrawing[])=>void;onStudy:(t:IndicatorType,v:StudySettings)=>void;onEdit:(t:IndicatorType)=>void;onRemove:(t:IndicatorType)=>void;onStatus:(s:CellStatus)=>void;magnet:Magnet;held:boolean;stay:boolean;onMagnet:()=>void;onStay:()=>void}){
 const {symbol,timeframe,id}=config,key=`${mode}:${symbol}:${timeframe}:${mode==='live'?0:asOf}`,drawingKey=`${id}:${mode}:${symbol}`
 const [frame,setFrame]=useState<{key:string;bars:Bar[]}|null>(null),[health,setHealth]=useState<LiveState['status']>('connecting'),[updated,setUpdated]=useState<number|null>(null),[error,setError]=useState(''),[tool,setTool]=useState<DrawingTool>('none')
 const request=useRef(new LatestRequest<Bar[]>()),statusRef=useRef(onStatus);statusRef.current=onStatus
 const safe=frame?.key===key,paintable=frame&&frame.key.startsWith(`${mode}:${symbol}:${timeframe}:`)&&(mode==='live'||Number(frame.key.split(':')[3])<=asOf)
 useEffect(()=>{
  setError('');setUpdated(null)
  if(mode==='live')return subscribeLive(symbol,timeframe,s=>{setHealth(s.status);setUpdated(s.lastUpdate);setError(s.error);if(s.bars.length)setFrame({key,bars:s.bars})})
  void request.current.run(async signal=>(await loadBars({symbol,timeframe,asOf},version,signal)).bars).then(bars=>{if(bars)setFrame({key,bars})}).catch(e=>setError(e.message))
  return()=>request.current.cancel()
 },[mode,symbol,timeframe,asOf,version])
 useEffect(()=>{statusRef.current({ready:!!safe,error,health,updated,close:safe?frame!.bars.at(-1)?.close??null:null})},[safe,error,health,updated,frame])
 useEffect(()=>{if(!active)setTool('none')},[active])
 const drawingRef=useRef(drawings);drawingRef.current=drawings
 const lastEdit=useRef(0)
 const history=useRef(new Map<string,{past:SavedDrawing[][];future:SavedDrawing[][]}>())
 function commit(next:SavedDrawing[],group=false){const h=history.current.get(drawingKey)??{past:[],future:[]};if(!group||performance.now()-lastEdit.current>30)h.past.push(drawingRef.current[drawingKey]??[]);lastEdit.current=group?performance.now():0;if(h.past.length>100)h.past.shift();h.future=[];history.current.set(drawingKey,h);drawingRef.current={...drawingRef.current,[drawingKey]:next};onDrawings(drawingKey,next)}
 function undo(redo=false){const h=history.current.get(drawingKey);if(!h)return;const from=redo?h.future:h.past,to=redo?h.past:h.future,previous=from.pop();if(!previous)return;to.push(drawingRef.current[drawingKey]??[]);drawingRef.current={...drawingRef.current,[drawingKey]:previous};lastEdit.current=0;onDrawings(drawingKey,previous)}
 const bars=paintable?frame!.bars:[],candles=useMemo(()=>bars.map(b=>({...b,time:b.time/1000})),[bars])
 const shown=visibleDrawings(drawings[drawingKey]??[],mode,asOf).map(d=>d.drawing)
 const message=cellMessage(mode,!!safe,!!paintable,error)
 return <div className="cell-content" data-mode={mode} data-symbol={symbol} data-timeframe={timeframe} data-as-of={mode==='replay'?asOf:undefined}>
  {paintable&&bars.length?<StudyWorkspace key={`${mode}:${symbol}:${timeframe}:${reset}`} cell={`${id}:${mode}`} bars={bars} bus={bus} active={config.indicators} settings={config.studies} onSettings={onStudy} onEdit={onEdit} onRemove={onRemove} drawingRailHost={activeDrawingRailHost(active,drawingRailHost)} panel={{candles,selectedSymbol:symbol,timeframe,isDark:true,activeIndicators:[],drawings:shown,drawingTool:active?tool:'none',onAddDrawing:d=>commit([...(drawingRef.current[drawingKey]??[]),{asOf,drawing:d}]),onUpdateDrawing:d=>commit((drawingRef.current[drawingKey]??[]).map(item=>item.drawing.id===d.id?{...item,drawing:d}:item),true),onRemoveDrawing:did=>commit((drawingRef.current[drawingKey]??[]).filter(item=>item.drawing.id!==did)),onClearDrawings:()=>commit([]),onDrawingToolSelect:setTool,onDrawingComplete:()=>{if(!stay)setTool('none')},onUndoDrawing:()=>undo(),onRedoDrawing:()=>undo(true),magnetMode:effectiveMagnet(magnet,active&&held),stayInDrawingMode:stay,onMagnetToggle:onMagnet,onStayInDrawingModeToggle:onStay,keyboardEnabled:active,showDrawingTools:active,positions:[],orders:[],pipDigits:symbol==='SOLUSDT'?3:2,isReplaying:mode==='replay',showNews:false,showLastPrice:true}}/>:null}
  {message?<div className="compare-message" role="status">{message}</div>:null}
  {mode==='live'?<div className={`cell-health ${health}`}>{health==='live'?'● Live':health==='stale'?'● Stale · reconnecting':'● Syncing'}{error?<span title={error}> · {error}</span>:null}</div>:null}
 </div>
}
