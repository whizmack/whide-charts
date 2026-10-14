import { expect, it } from 'vitest'
import type { DrawingsDocument } from '@luxalgo/vela'
import { visibleDrawing } from './sessions'

it('does not reveal a drawing created later in the session', () => {
  expect(visibleDrawing(true, 2000, 1000)).toBe(false)
  expect(visibleDrawing(true, 2000, 2000)).toBe(true)
})
it('does not unhide a deliberately hidden drawing', () => {
  expect(visibleDrawing(false, 1000, 2000)).toBe(false)
})

it('seeds live with appearance and indicators without carrying replay drawings or mutating it', async () => {
  const { seedLiveSession, restoreWithAppearance } = await import('./sessions')
  const source = {schemaVersion:1 as const,selection:{symbol:'BTCUSDT' as const,timeframe:'5m' as const,asOf:1000},datasetVersion:'immutable',speed:2,
    drawingsCreatedAt:{'BTCUSDT:line':1000},chartsBySymbol:{BTCUSDT:{drawings:{version:1 as const,drawings:[{id:'line',visible:true}] as DrawingsDocument['drawings']},indicators:[{type:'ema',inputs:{length:50},visible:true}],viewport:{from:0,to:1000},renderer:{grid:false}}}}
  const live=seedLiveSession(source,5000)
  expect(live.datasetVersion).toBe('live');expect(live.selection.asOf).toBe(5000)
  expect(live.drawingsCreatedAt).toEqual({});expect(live.chartsBySymbol.BTCUSDT?.drawings.drawings).toEqual([]);expect(live.chartsBySymbol.BTCUSDT?.viewport).toBeNull()
  expect(live.chartsBySymbol.BTCUSDT?.indicators[0].inputs.length).toBe(50)
  const replay=restoreWithAppearance(source,{grid:true})!
  expect(replay.selection).toEqual(source.selection);expect(replay.datasetVersion).toBe('immutable')
  expect(replay.chartsBySymbol.BTCUSDT?.renderer).toEqual({grid:true})
  expect(source.chartsBySymbol.BTCUSDT.renderer).toEqual({grid:false});expect(source.chartsBySymbol.BTCUSDT.viewport).toEqual({from:0,to:1000})
})
