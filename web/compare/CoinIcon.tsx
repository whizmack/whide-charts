import type {Symbol} from '../replay'

/** Decorative asset mark; the adjoining symbol supplies its accessible name. */
export function CoinIcon({symbol}:{symbol:Symbol}){
 return <span className={`coin-icon ${symbol}`} aria-hidden="true">
  {symbol==='BTCUSDT'?<span>₿</span>:symbol==='ETHUSDT'?
   <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 5.5 12 12 15l6.5-3L12 2Zm-6.5 12L12 22l6.5-8-6.5 3-6.5-3Z"/></svg>:
   <svg viewBox="0 0 24 24" fill="currentColor"><path d="m6 5 2-2h12l-2 3H6Zm1 6h11l2 3H9l-2-3Zm-2 6h12l-2 3H3l2-3Z"/></svg>}
 </span>
}
