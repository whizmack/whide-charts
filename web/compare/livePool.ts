import {LiveFeed,type LiveState} from '../live'
import type {Symbol,Timeframe} from '../replay'
type Entry={feed:LiveFeed;listeners:Set<(s:LiveState)=>void>;state?:LiveState}
const feeds=new Map<string,Entry>()
/** Visible cells sharing a market also share its public socket and recovery. */
export function subscribeLive(symbol:Symbol,timeframe:Timeframe,listener:(s:LiveState)=>void){
 const key=symbol+':'+timeframe;let entry=feeds.get(key)
 if(!entry){const listeners=new Set<(s:LiveState)=>void>();const value:Entry={listeners,feed:new LiveFeed(symbol,timeframe,s=>{value.state=s;for(const fn of listeners)fn(s)})};entry=value;feeds.set(key,entry)}
 entry.listeners.add(listener);if(entry.state)listener(entry.state);entry.feed.start()
 return()=>{entry.listeners.delete(listener);if(!entry.listeners.size)entry.feed.stop()}
}
