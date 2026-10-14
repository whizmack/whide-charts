import { useState } from 'react'
import { Cross2Icon, PlusIcon } from '@radix-ui/react-icons'
import { INDICATORS, type ChartBridge } from './chartBridge'

export function Indicators({ bridge }: { bridge: ChartBridge | null }) {
  const [, redraw] = useState(0)
  const handles = bridge?.indicators() ?? []
  return <>
    <p className="helper">Indicators use the candles available in the current chart. In Replay, future candles remain hidden.</p>
    <div className="indicator-options">{INDICATORS.map(ind => <button key={ind.type} onClick={() => { bridge?.addIndicator(ind.type); redraw(v => v+1) }}><PlusIcon />{ind.label}</button>)}</div>
    <h3>On chart</h3>
    {handles.map(handle => <div className="study" key={handle.id}>
      <div className="study-heading"><strong>{handle.title}</strong><button className="icon-button" aria-label={`Remove ${handle.title}`} onClick={() => { handle.remove(); redraw(v => v+1) }}><Cross2Icon /></button></div>
      <div className="study-inputs">{handle.inputs.filter(input => input.type === 'int' || input.type === 'float').map(input => <label key={input.key}>{input.title}<input type="number" min={input.min} max={input.max} step={input.step ?? 1} defaultValue={Number(handle.inputValues()[input.key] ?? input.defval)} onBlur={event => {
        const value = Number(event.target.value)
        if (Number.isFinite(value) && (!input.min || value >= input.min) && (!input.max || value <= input.max)) handle.setInput(input.key, value)
      }} /></label>)}</div>
    </div>)}
  </>
}
