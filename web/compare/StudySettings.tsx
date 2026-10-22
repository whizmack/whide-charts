import {Dialog} from './Dialog'
import type {IndicatorType} from '@dylanpersonguy/opencharts'
import {isOscillator,normalizeStudy,type StudySettings} from './studies'
export function StudySettingsDialog({type,value,onSave,onClose}:{type:IndicatorType;value:StudySettings;onSave:(v:StudySettings)=>void;onClose:()=>void}){
 return <Dialog title={`${type} settings`} onClose={onClose}><form className="study-form" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget),patch:Record<string,unknown>={...value};for(const [key,v]of form)patch[key]=['period','fast','slow','signal','stdDev','smoothing','width'].includes(key)?Number(v):v;onSave(normalizeStudy(type,patch));onClose()}}>
 <div className="study-fields">
 {type!=='VWAP'&&type!=='MACD'?<label>Length<input name="period" type="number" min="1" max="500" defaultValue={value.period} required/></label>:null}
 {type==='MACD'?(['fast','slow','signal'] as const).map(k=><label key={k}>{k==='fast'?'Fast length':k==='slow'?'Slow length':'Signal smoothing'}<input name={k} type="number" min="1" max="500" defaultValue={value[k]} required/></label>):null}
 {!['ATR','STOCH','VWAP'].includes(type)?<label>Source<select name="source" defaultValue={value.source}>{['close','open','high','low','hl2','hlc3'].map(s=><option key={s}>{s}</option>)}</select></label>:null}
 {type==='RSI'?<label>Smoothing · SMA length<input name="smoothing" type="number" min="1" max="500" defaultValue={value.smoothing} required/></label>:null}
 {type==='BOLL'?<label>Standard deviation<input name="stdDev" type="number" min="0.1" max="10" step="0.1" defaultValue={value.stdDev} required/></label>:null}
 {type==='STOCH'?<label>%D smoothing<input name="signal" type="number" min="1" max="500" defaultValue={value.signal} required/></label>:null}
 <label>Line color<input name="color" type="color" defaultValue={value.color}/></label>
 {['RSI','MACD','STOCH','BOLL'].includes(type)?<label>Secondary line<input name="secondaryColor" type="color" defaultValue={value.secondaryColor}/></label>:null}
 <label>Line width<select name="width" defaultValue={value.width}>{[1,2,3,4].map(w=><option key={w} value={w}>{w} px</option>)}</select></label>
 <label>Line style<select name="style" defaultValue={value.style}>{['solid','dashed','dotted'].map(s=><option key={s}>{s}</option>)}</select></label>
 {isOscillator(type)?<label>Pane position<select name="placement" defaultValue={value.placement}><option value="below">Below price</option><option value="above">Above price</option></select></label>:null}
 </div><div className="dialog-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit">Apply</button></div>
 </form></Dialog>
}
