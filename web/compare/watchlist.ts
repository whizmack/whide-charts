import type {LiveState} from '../live'
import type {Symbol} from '../replay'

export const watchlistSymbols=['BTCUSDT','ETHUSDT','SOLUSDT'] as const satisfies readonly Symbol[]
export type LiveQuotes=Partial<Record<Symbol,LiveState>>

export function watchlistStatus(quotes:LiveQuotes){
 const states=watchlistSymbols.map(symbol=>quotes[symbol]?.status)
 if(states.some(status=>status==='stale'))return 'Reconnecting'
 if(states.every(status=>status==='live'))return 'Live'
 return 'Connecting'
}

export function watchlistLast(quotes:LiveQuotes,symbol:Symbol){
 return quotes[symbol]?.bars.at(-1)?.close??null
}
