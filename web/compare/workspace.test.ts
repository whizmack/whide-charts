import {expect,it} from 'vitest'
import {initialWorkspace,changeCell,visibleIds,logicalAt,timeAt,loadWorkspace,quickRangeWindow,chartBusCellId,calendarMonth,resolveGotoTime,resolveDateRange} from './workspace'
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
it('resolves TradingView quick ranges from the loaded window without reaching beyond it',()=>{
  const first=Date.UTC(2023,0,1),last=Date.UTC(2023,2,31,23),hour=60*60_000
  expect(quickRangeWindow('1D',first,last,'1h')).toEqual({from:Date.UTC(2023,2,31),to:last+hour})
  expect(quickRangeWindow('1M',first,last,'1h')).toEqual({from:Date.UTC(2023,2,1),to:last+hour})
  expect(quickRangeWindow('YTD',first,last,'1h')).toEqual({from:first,to:last+hour})
  expect(quickRangeWindow('All',first,last,'1h')).toEqual({from:first,to:last+hour})
  expect(quickRangeWindow('5Y',Date.UTC(2023,2,15),last,'1h')?.from).toBe(Date.UTC(2023,2,15))
})
it('uses the same chart-and-mode identity for viewport controls and chart panes',()=>{
  expect(chartBusCellId('chart-2','live')).toBe('chart-2:live')
  expect(chartBusCellId('chart-2','replay')).toBe('chart-2:replay')
})
it('builds a Monday-first UTC calendar and disables days outside loaded bars',()=>{
  const min=Date.UTC(2026,9,2,12),max=Date.UTC(2026,9,8,9)
  const month=calendarMonth(2026,9,min,max)
  expect(month.label).toBe('October 2026')
  expect(month.days.slice(0,3)).toEqual([null,null,null])
  expect(month.days.find(day=>day?.date==='2026-10-01')?.disabled).toBe(true)
  expect(month.days.find(day=>day?.date==='2026-10-02')?.disabled).toBe(false)
  expect(month.days.find(day=>day?.date==='2026-10-09')?.disabled).toBe(true)
})
it('resolves Go to date/time and custom date windows only inside loaded data',()=>{
  const bounds={start:Date.UTC(2023,0,2,10),last:Date.UTC(2023,0,4,11),end:Date.UTC(2023,0,4,12)}
  expect(resolveGotoTime('2023-01-02','10:00',bounds)).toBe(bounds.start)
  expect(resolveGotoTime('2023-01-02','09:59',bounds)).toBeNull()
  expect(resolveGotoTime('2023-01-04','12:01',bounds)).toBeNull()
  expect(resolveDateRange('2023-01-01','2023-01-04',bounds)).toEqual({from:bounds.start,to:bounds.end})
  expect(resolveDateRange('2023-01-04','2023-01-02',bounds)).toBeNull()
})
it('rejects malformed persisted layout and selections without losing the app',()=>{
  const w=loadWorkspace({layout:'evil',cells:[{id:'chart-1',symbol:'DOGE',timeframe:'0m'}],asOf:'tomorrow'})
  expect(w.layout).toBe('one');expect(w.cells).toHaveLength(4)
  expect(w.cells[0].symbol).toBe('BTCUSDT');expect(Number.isFinite(w.asOf)).toBe(true)
})
