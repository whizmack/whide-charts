import {expect,it} from 'vitest'
import type {LiveState} from '../live'
import {watchlistLast,watchlistStatus,watchlistSymbols} from './watchlist'

function quote(close:number,status:LiveState['status']='live'):LiveState{
 return {bars:[{time:60_000,open:close,high:close,low:close,close,volume:1}],status,lastUpdate:60_000,error:''}
}

it('shows latest independent live quotes for each supported watchlist symbol',()=>{
 const quotes={BTCUSDT:quote(100),ETHUSDT:quote(200),SOLUSDT:quote(30)}
 expect(watchlistSymbols).toEqual(['BTCUSDT','ETHUSDT','SOLUSDT'])
 expect(watchlistSymbols.map(symbol=>watchlistLast(quotes,symbol))).toEqual([100,200,30])
})

it('reports aggregate quote connection state without hiding last known values',()=>{
 const quotes={BTCUSDT:quote(100),ETHUSDT:quote(200,'stale'),SOLUSDT:quote(30)}
 expect(watchlistStatus(quotes)).toBe('Reconnecting')
 expect(watchlistLast(quotes,'ETHUSDT')).toBe(200)
 expect(watchlistStatus({BTCUSDT:quote(100)})).toBe('Connecting')
 expect(watchlistStatus({BTCUSDT:quote(100),ETHUSDT:quote(200),SOLUSDT:quote(30)})).toBe('Live')
})
