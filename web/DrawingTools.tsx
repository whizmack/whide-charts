import type { DrawingTypeKey } from '@luxalgo/vela'
import type { ChartBridge } from './chartBridge'

const tools: { type: DrawingTypeKey; label: string; hint: string }[] = [
  { type:'trendline', label:'Trendline', hint:'Select two points to define the line.' },
  { type:'hline', label:'Horizontal line', hint:'Select a point to set the price level.' },
  { type:'box', label:'Rectangle / zone', hint:'Select two opposite corners.' },
  { type:'fibretracement', label:'Fibonacci', hint:'Select the start and end of the move.' },
  { type:'text', label:'Text', hint:'Select a position. Double-click to edit the text.' },
  { type:'datepricerange', label:'Price and time range', hint:'Select two points to measure price change and duration.' },
  { type:'position', label:'Long / Short position', hint:'The first point sets entry. Place the second above entry for a long or below for a short. Drag entry, SL and TP to adjust.' },
]

export function DrawingTools({ bridge, onChoose }: { bridge: ChartBridge | null; onChoose: () => void }) {
  return <div className="drawing-options">{tools.map(tool => <button key={tool.type} onClick={() => { bridge?.chart.drawings.setTool(tool.type); onChoose() }}><strong>{tool.label}</strong><span>{tool.hint}</span></button>)}</div>
}
