import {expect,it} from 'vitest'
import {initialWorkspace,changeCell,visibleIds,logicalAt,timeAt,loadWorkspace} from './workspace'
it('keeps all four configurations when a layout is reduced and restored',()=>{
  let w=initialWorkspace();w={...w,layout:'four'}
  w=changeCell(w,'chart-3',{symbol:'SOLUSDT',timeframe:'4h'})
  expect(visibleIds({...w,layout:'one'})).toEqual(['chart-1'])
  expect(visibleIds(w)).toHaveLength(4)
  expect(w.cells[2].symbol).toBe('SOLUSDT');expect(w.cells[2].timeframe).toBe('4h')
  expect(w.cells[0].timeframe).toBe('5m')
})
it('maps viewport timestamps between unequal timeframes including whitespace',()=>{
  const five=[0,300,600,900],hour=[0,3600,7200]
  const t=timeAt(five,2.5,300)
  expect(t).toBe(750);expect(logicalAt(hour,t,3600)).toBeCloseTo(750/3600)
  expect(timeAt(five,6,300)).toBe(1800)
  expect(logicalAt(five,-300,300)).toBe(-1)
})
it('maps irregular bars by their timestamps and does not invent a crosshair value',()=>{
  expect(logicalAt([100,200,400],300,100)).toBe(1.5)
  expect(timeAt([100,200,400],1.5,100)).toBe(300)
})
it('rejects malformed persisted layout and selections without losing the app',()=>{
  const w=loadWorkspace({layout:'evil',cells:[{id:'chart-1',symbol:'DOGE',timeframe:'0m'}],asOf:'tomorrow'})
  expect(w.layout).toBe('one');expect(w.cells).toHaveLength(4)
  expect(w.cells[0].symbol).toBe('BTCUSDT');expect(Number.isFinite(w.asOf)).toBe(true)
})
