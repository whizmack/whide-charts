import {useEffect,useState} from 'react'
import type {Symbol} from '../replay'
import {subscribeLive} from './livePool'
import {watchlistLast,watchlistStatus,watchlistSymbols,type LiveQuotes} from './watchlist'

export function WatchlistPanel({activeSymbol,onSelect}:{activeSymbol:Symbol;onSelect:(symbol:Symbol)=>void}){
 const [quotes,setQuotes]=useState<LiveQuotes>({})
 useEffect(()=>{
  const unsubscribers=watchlistSymbols.map(symbol=>subscribeLive(symbol,'1m',state=>setQuotes(previous=>({...previous,[symbol]:state}))))
  return()=>unsubscribers.forEach(unsubscribe=>unsubscribe())
 },[])
 const connection=watchlistStatus(quotes)
 return <aside className="workspace-watchlist">
  <header><h2>Watchlist</h2><span className={`watchlist-connection ${connection.toLowerCase()}`} role="status" aria-live="polite">{connection}</span></header>
  <div className="watchlist-head"><span>Symbol</span><span>Last</span></div>
  {watchlistSymbols.map(symbol=>{
   const price=watchlistLast(quotes,symbol)
   return <button key={symbol} aria-pressed={activeSymbol===symbol} onClick={()=>onSelect(symbol)}>
    <span className={`coin-icon ${symbol}`}>{symbol==='BTCUSDT'?'₿':symbol==='ETHUSDT'?'Ξ':'◎'}</span>
    <strong>{symbol}</strong>
    <span>{price?.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:symbol==='SOLUSDT'?3:2})??'—'}</span>
   </button>
  })}
  <p>Live prices continue while charts are in Replay.<br/>Click a symbol to change the active chart.</p>
 </aside>
}
