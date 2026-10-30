import {useEffect,useId,useRef,useState,type CSSProperties,type KeyboardEvent} from 'react'
import {ChevronDownIcon} from '@radix-ui/react-icons'
import {Dialog} from './Dialog'
import {TradingViewColorPicker,type IndicatorType} from '@dylanpersonguy/opencharts'
import {isOscillator,normalizeStudy,defaultStudy,type StudySettings} from './studies'
import {TIMEFRAMES,type Timeframe} from '../replay'

type StudyTab='inputs'|'style'|'visibility'
const tabs:StudyTab[]=['inputs','style','visibility']
const tabLabels:Record<StudyTab,string>={inputs:'Inputs',style:'Style',visibility:'Visibility'}
const sources:StudySettings['source'][]=['close','open','high','low','hl2','hlc3']
const sourceLabels:Record<StudySettings['source'],string>={close:'Close',open:'Open',high:'High',low:'Low',hl2:'HL2',hlc3:'HLC3'}
const multiLineTypes:IndicatorType[]=['RSI','MACD','BOLL','STOCH']

export function StudySettingsDialog({type,value,onSave,onClose}:{type:IndicatorType;value:StudySettings;onSave:(v:StudySettings)=>void;onClose:()=>void}){
 const [draft,setDraft]=useState(value),[tab,setTab]=useState<StudyTab>('inputs'),[defaultsOpen,setDefaultsOpen]=useState(false)
 const tabRefs=useRef<Partial<Record<StudyTab,HTMLButtonElement|null>>>({})
 const baseId=useId(),valueKey=JSON.stringify(value)
 useEffect(()=>{setDraft(value);setTab('inputs');setDefaultsOpen(false)},[type,valueKey])
 const patch=(next:Partial<StudySettings>)=>setDraft(current=>({...current,...next}))
 const selectTab=(next:StudyTab)=>{setTab(next);setDefaultsOpen(false)}
 const onTabKeyDown=(event:KeyboardEvent<HTMLButtonElement>)=>{
  const current=tabs.indexOf(tab)
  const next=event.key==='ArrowRight'?tabs[(current+1)%tabs.length]:event.key==='ArrowLeft'?tabs[(current+tabs.length-1)%tabs.length]:undefined
  if(!next)return
  event.preventDefault();selectTab(next);requestAnimationFrame(()=>tabRefs.current[next]?.focus())
 }
 const resetDefaults=()=>{setDraft(defaultStudy(type));setDefaultsOpen(false)}

 return <Dialog title={`${type} settings`} onClose={onClose} className="study-settings-dialog">
  <form className="study-settings-form" onSubmit={event=>{event.preventDefault();onSave(normalizeStudy(type,draft));onClose()}}>
   <div className="study-settings-tabs" role="tablist" aria-label={`${type} settings`}>
    {tabs.map(name=><button key={name} ref={node=>{tabRefs.current[name]=node}} type="button" role="tab" id={`${baseId}-${name}`} aria-controls={`${baseId}-panel`} aria-selected={tab===name} tabIndex={tab===name?0:-1} onClick={()=>selectTab(name)} onKeyDown={onTabKeyDown}>{tabLabels[name]}</button>)}
   </div>
   <div className="study-settings-body" role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-${tab}`} tabIndex={0}>
    {tab==='inputs'?<div className="study-input-settings">
     {type!=='VWAP'&&type!=='MACD'?<NumericSetting label="Length" value={draft.period} min={1} max={500} onChange={period=>patch({period})}/>:null}
     {type==='MACD'?<>
      <NumericSetting label="Fast length" value={draft.fast} min={1} max={499} onChange={fast=>patch({fast})}/>
      <NumericSetting label="Slow length" value={draft.slow} min={2} max={500} onChange={slow=>patch({slow})}/>
      <NumericSetting label="Signal smoothing" value={draft.signal} min={1} max={500} onChange={signal=>patch({signal})}/>
     </>:null}
     {!['ATR','STOCH','VWAP'].includes(type)?<label className="study-setting-row"><span>Source</span><select aria-label="Source" value={draft.source} onChange={event=>patch({source:event.currentTarget.value as StudySettings['source']})}>{sources.map(source=><option key={source} value={source}>{sourceLabels[source]}</option>)}</select></label>:null}
     {type==='RSI'?<NumericSetting label="SMA smoothing" value={draft.smoothing} min={1} max={500} onChange={smoothing=>patch({smoothing})}/>:null}
     {type==='BOLL'?<NumericSetting label="Standard deviation" value={draft.stdDev} min={0.1} max={10} step={0.1} onChange={stdDev=>patch({stdDev})}/>:null}
     {type==='STOCH'?<NumericSetting label="Signal smoothing" value={draft.signal} min={1} max={500} onChange={signal=>patch({signal})}/>:null}
     {isOscillator(type)?<label className="study-setting-row"><span>Pane position</span><select aria-label="Pane position" value={draft.placement} onChange={event=>patch({placement:event.currentTarget.value as StudySettings['placement']})}><option value="below">Below price</option><option value="above">Above price</option></select></label>:null}
     {type==='VWAP'?<p className="study-settings-note">VWAP uses the loaded bars and resets at UTC midnight.</p>:null}
    </div>:null}

    {tab==='style'?<div className="study-style-settings">
     <div className="study-style-main-row">
      <label className="study-style-toggle"><input type="checkbox" checked={draft.lineVisible} onChange={event=>patch({lineVisible:event.currentTarget.checked})}/><span>{type}</span></label>
      <div className="study-line-color" aria-label={`${type} line color`}>
       <TradingViewColorPicker label={`${type} line color`} value={draft.color} onChange={color=>patch({color})} className="study-settings-color-trigger" popoverFooter={<StudyLinePopover width={draft.width} style={draft.style} onWidthChange={width=>patch({width})} onStyleChange={style=>patch({style})}/>}/>
       <span className={`study-line-preview is-${draft.style}`} style={{'--study-line-color':draft.color} as CSSProperties} aria-hidden="true"/>
      </div>
     </div>
     {multiLineTypes.includes(type)?<label className="study-setting-row study-secondary-color-row"><span>Secondary line</span><TradingViewColorPicker label="Secondary line color" value={draft.secondaryColor} onChange={secondaryColor=>patch({secondaryColor})} className="study-settings-color-trigger"/></label>:null}
     <section className="study-style-options" aria-labelledby={`${baseId}-output-values`}>
      <h3 id={`${baseId}-output-values`}>Output values</h3>
      <CheckSetting label="Labels on price scale" checked={draft.showPriceLabel} onChange={showPriceLabel=>patch({showPriceLabel})}/>
      <CheckSetting label="Values in status line" checked={draft.showStatusLineValues} onChange={showStatusLineValues=>patch({showStatusLineValues})}/>
     </section>
     <section className="study-style-options study-input-display-option" aria-labelledby={`${baseId}-input-values`}>
      <h3 id={`${baseId}-input-values`}>Input values</h3>
      <CheckSetting label="Inputs in status line" checked={draft.showStatusLineInputs} onChange={showStatusLineInputs=>patch({showStatusLineInputs})}/>
     </section>
    </div>:null}

    {tab==='visibility'?<fieldset className="study-visibility-settings">
     <legend>Show study on these timeframes</legend>
     <div className="study-timeframe-options">{TIMEFRAMES.map((timeframe:Timeframe)=>{
      const checked=draft.visibleTimeframes.includes(timeframe)
      return <label key={timeframe}><input type="checkbox" checked={checked} onChange={event=>patch({visibleTimeframes:event.currentTarget.checked?[...draft.visibleTimeframes,timeframe]:draft.visibleTimeframes.filter(value=>value!==timeframe)})}/><span>{timeframe}</span></label>
     })}</div>
     <p>Hidden timeframes keep the study in this chart and do not affect other charts.</p>
    </fieldset>:null}
   </div>
   <footer className="study-settings-footer">
    <div className="study-defaults-wrap" onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setDefaultsOpen(false)}}>
     <button type="button" className="study-defaults-button" aria-haspopup="menu" aria-expanded={defaultsOpen} onClick={()=>setDefaultsOpen(open=>!open)}>Defaults <ChevronDownIcon/></button>
     {defaultsOpen?<div className="study-defaults-menu" role="menu"><button type="button" role="menuitem" onClick={resetDefaults}>Reset settings</button></div>:null}
    </div>
    <div className="study-settings-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="study-settings-ok">Ok</button></div>
   </footer>
  </form>
 </Dialog>
}

export function StudyLinePopover({width,style,onWidthChange,onStyleChange}:{width:StudySettings['width'];style:StudySettings['style'];onWidthChange:(width:StudySettings['width'])=>void;onStyleChange:(style:StudySettings['style'])=>void}){
 const widths:StudySettings['width'][]=[1,2,3,4]
 const styles:StudySettings['style'][]=['solid','dashed','dotted']
 return <div className="study-line-popover-controls">
  <fieldset className="study-line-popover-group">
   <legend>Thickness</legend>
   <div role="group" aria-label="Thickness" className="study-line-popover-options">
    {widths.map(value=><button key={value} type="button" aria-label={`${value} px`} aria-pressed={width===value} onClick={()=>onWidthChange(value)}><span className="study-line-width-sample" style={{'--study-line-width':`${value}px`} as CSSProperties} aria-hidden="true"/><span aria-hidden="true">{value}</span></button>)}
   </div>
  </fieldset>
  <fieldset className="study-line-popover-group">
   <legend>Line style</legend>
   <div role="group" aria-label="Line style" className="study-line-popover-options">
    {styles.map(value=><button key={value} type="button" aria-label={value[0]!.toUpperCase()+value.slice(1)} aria-pressed={style===value} onClick={()=>onStyleChange(value)}><span className={`study-line-style-sample is-${value}`} aria-hidden="true"/></button>)}
   </div>
  </fieldset>
 </div>
}

function NumericSetting({label,value,min,max,step=1,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(value:number)=>void}){
 return <label className="study-setting-row"><span>{label}</span><input aria-label={label} type="number" min={min} max={max} step={step} required value={value} onChange={event=>onChange(Number(event.currentTarget.value))}/></label>
}

function CheckSetting({label,checked,onChange}:{label:string;checked:boolean;onChange:(checked:boolean)=>void}){
 return <label className="study-setting-check-row"><input type="checkbox" checked={checked} onChange={event=>onChange(event.currentTarget.checked)}/><span>{label}</span></label>
}
