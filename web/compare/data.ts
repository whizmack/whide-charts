import type { CandleRequest } from '@dylanpersonguy/opencharts'
import type { Bar } from '../api'
export type Frame = { symbol:string; timeframe:string; bars:Bar[] }
/** The adapter can only paginate inside the prefix supplied by our data owner. */
export function chartWindow(frame:Frame, request:CandleRequest) {
  if(request.symbol!==frame.symbol || request.timeframe!==frame.timeframe) return []
  return frame.bars.filter(bar=>(request.fromMs===undefined || bar.time>=request.fromMs) && (request.toMs===undefined || bar.time<request.toMs))
    .slice(-Math.max(1,Math.min(request.limit ?? 1000,1000))).map(bar=>({...bar,time:bar.time/1000}))
}
export function visibleDrawings<T extends {asOf:number}>(drawings:T[],mode:'live'|'replay',asOf:number):T[] {
  return mode==='live'?drawings:drawings.filter(d=>d.asOf<=asOf)
}
