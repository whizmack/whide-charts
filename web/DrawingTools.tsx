import type { DrawingTypeKey } from '@luxalgo/vela'
import type { ChartBridge } from './chartBridge'

const tools: { type: DrawingTypeKey; label: string; hint: string }[] = [
  { type:'trendline', label:'Trendline', hint:'Dva body určují sklon linie.' },
  { type:'hline', label:'Horizontální linie', hint:'Jeden bod určuje cenovou úroveň.' },
  { type:'box', label:'Obdélník / zóna', hint:'Vyberte dva protilehlé rohy.' },
  { type:'fibretracement', label:'Fibonacci', hint:'Označte začátek a konec pohybu.' },
  { type:'text', label:'Text', hint:'Vyberte místo; dvojklik otevře nastavení textu.' },
  { type:'datepricerange', label:'Měření ceny a času', hint:'Dva body změří pohyb a jeho délku.' },
  { type:'position', label:'Long / Short pozice', hint:'První bod je entry. Druhý bod nad entry vytvoří long, pod entry short. Entry, SL i TP lze přetahovat.' },
]

export function DrawingTools({ bridge, onChoose }: { bridge: ChartBridge | null; onChoose: () => void }) {
  return <div className="drawing-options">{tools.map(tool => <button key={tool.type} onClick={() => { bridge?.chart.drawings.setTool(tool.type); onChoose() }}><strong>{tool.label}</strong><span>{tool.hint}</span></button>)}</div>
}
