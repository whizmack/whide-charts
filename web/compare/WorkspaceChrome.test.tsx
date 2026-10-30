import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it,vi} from 'vitest'
import {
 ActiveChartMaximizeButton,
 CellCaption,
 createWorkspaceBackup,
 IndicatorToolbarButton,
 LiveTransport,
 PairSelector,
 ReplayTransport,
 shouldShowCellCaption,
 WorkspaceRangeToolbar,
 WorkspaceDrawingRailHost,
 WorkspaceAboutDialog,
 WorkspaceMagnetMenu,
 WorkspaceSettingsMenu,
 WorkspaceUtilityRail,
 activeDrawingRailHost,
 filterSupportedPairs,
 menuFocusIndex,
} from './WorkspaceChrome'
import {initialWorkspace,QUICK_RANGES} from './workspace'
import {ChartBus} from './chartBus'
import type {DrawingStore} from './ChartCell'
import {filterIndicatorTypes,IndicatorBrowser} from './IndicatorBrowser'

const noop=vi.fn()

describe('workspace drawing rail',()=>{
 it('renders one named host and routes it only to the active chart',()=>{
  const markup=renderToStaticMarkup(createElement(WorkspaceDrawingRailHost,{setHost:noop}))
  const host={} as HTMLDivElement
  expect(markup).toContain('class="drawing-rail-host"')
  expect(markup).toContain('aria-label="Drawing tools"')
  expect(activeDrawingRailHost(false,host)).toBeNull()
  expect(activeDrawingRailHost(true,host)).toBe(host)
 })
})

describe('workspace utility rail',()=>{
 it.each([
  ['ETH',['ETHUSDT']],
  ['ethereum tether',['ETHUSDT']],
  ['USDT',['BTCUSDT','ETHUSDT','SOLUSDT']],
  ['usd-m perpetual',['BTCUSDT','ETHUSDT','SOLUSDT']],
  ['unknown',[]],
 ] as const)('filters supported pairs by symbol, asset, and market terms (%s)',(query,expected)=>{
  expect(filterSupportedPairs(query)).toEqual(expected)
 })

 it('renders the pair picker as a named search dialog instead of a native select',()=>{
  const markup=renderToStaticMarkup(createElement(PairSelector,{value:'BTCUSDT',onChange:noop}))
  expect(markup).toContain('aria-label="Pair"')
  expect(markup).toContain('aria-haspopup="dialog"')
  expect(markup).toContain('BTCUSDT')
  expect(markup).not.toContain('<select')
 })

 it.each([
  ['moving average','all',['SMA','EMA','MACD']],
  ['','overlays',['SMA','EMA','BOLL','VWAP']],
  ['pane','oscillators',['RSI','MACD','ATR','STOCH']],
  ['overlay','oscillators',[]],
 ] as const)('filters the indicator browser by text and supported category (%s / %s)',(query,category,expected)=>{
  expect(filterIndicatorTypes(query,category)).toEqual(expected)
 })

 it('shows each indicator placement once in its own compact table column',()=>{
  const markup=renderToStaticMarkup(createElement(IndicatorBrowser,{
   open:false,symbol:'BTCUSDT',timeframe:'4h',active:[],triggerRef:{current:null},onClose:noop,onToggle:noop,onEdit:noop,
  }))
  expect(markup).toContain('class="indicator-browser-code-spacer" aria-hidden="true"></span><span>NAME</span><span class="indicator-browser-heading-placement">PLACEMENT</span>')
  expect(markup).toContain('class="indicator-browser-heading-placement">PLACEMENT</span>')
  expect(markup).toContain('class="indicator-browser-type">Price overlay</span>')
  expect(markup).toContain('class="indicator-browser-type">Separate pane</span>')
  expect(markup).toContain('role="status" aria-live="polite" aria-atomic="true">8 indicators found</div>')
 })

 it('keeps the responsive Indicators icon named and discoverable',()=>{
  const markup=renderToStaticMarkup(createElement(IndicatorToolbarButton,{expanded:false,onToggle:noop}))
  expect(markup).toContain('aria-label="Indicators"')
  expect(markup).toContain('class="toolbar-action alignment-control"')
  expect(markup).toContain('title="Indicators"')
  expect(markup).toContain('aria-expanded="false"')
 })

 it('gives the active-chart icon action an accessible name and tooltip',()=>{
  const maximize=renderToStaticMarkup(createElement(ActiveChartMaximizeButton,{maximized:false,onToggle:noop}))
  const restore=renderToStaticMarkup(createElement(ActiveChartMaximizeButton,{maximized:true,onToggle:noop}))
  expect(maximize).toContain('aria-label="Maximize active chart"')
  expect(maximize).toContain('title="Maximize active chart"')
  expect(restore).toContain('aria-label="Restore chart layout"')
  expect(restore).toContain('title="Restore chart layout"')
 })

 it('exposes only working workspace actions with their open states',()=>{
  const markup=renderToStaticMarkup(createElement(WorkspaceUtilityRail,{
   watchlistOpen:true,
   layoutOpen:true,
   onToggleWatchlist:noop,
   onToggleLayout:noop,
   onOpenSettings:noop,
   onOpenAbout:noop,
   onExport:noop,
  }))
  expect(markup).toContain('aria-label="Watchlist"')
  expect(markup.match(/class="alignment-icon-control"/g)).toHaveLength(4)
  expect(markup).toContain('title="Watchlist"')
  expect(markup).toContain('aria-pressed="true"')
  expect(markup).toContain('aria-label="Chart layout"')
  expect(markup).toContain('title="Chart layout"')
  expect(markup).toContain('aria-expanded="true"')
  expect(markup).toContain('aria-label="Settings"')
  expect(markup).toContain('title="Settings"')
  expect(markup).toContain('aria-label="Export workspace backup"')
  expect(markup).toContain('title="Export workspace backup"')
 })
})

describe('workspace transport and menus',()=>{
 it('renders TradingView date ranges and a date/custom-range Go to dialog',()=>{
  const markup=renderToStaticMarkup(createElement(WorkspaceRangeToolbar,{
   cell:'chart-1',timeframe:'1h',mode:'live',asOf:0,bus:new ChartBus(),
  }))
  expect(markup).toContain('aria-label="Chart date ranges"')
  for(const range of QUICK_RANGES)expect(markup).toContain(`aria-label="${range} chart range"`)
  expect(markup).toContain('aria-label="Go to date and time"')
  expect(markup).toContain('class="workspace-goto-dialog"')
  expect(markup).toContain('role="tablist" aria-label="Go to options"')
  expect(markup).toContain('Date')
  expect(markup).toContain('Custom range')
  expect(markup).toContain('aria-label="Go to calendar"')
  expect(markup).toContain('class="workspace-range-clock"')
  expect(markup).toContain('aria-label="Current UTC time"')
  expect(markup).toContain(' UTC</time>')
  expect(markup).toContain('aria-label="Go to date and time · UTC"')
 })

 it('renders the complete paused Replay transport',()=>{
  const markup=renderToStaticMarkup(createElement(ReplayTransport,{
   asOf:Date.UTC(2023,0,8),
   available:{start:Date.UTC(2023,0,1),end:Date.UTC(2023,1,1)},
   playing:false,
   ready:true,
   speed:1,
   timeframe:'5m',
   onSeek:noop,
   onTogglePlaying:noop,
   onStep:noop,
   onSpeed:noop,
  }))
  expect(markup).toContain('aria-label="Replay time · UTC"')
  expect(markup).toContain('class="alignment-numeric-control"')
  expect(markup).toContain('>Go</button>')
  expect(markup).toContain('aria-label="Play replay"')
  expect(markup).toContain('title="Play replay"')
  expect(markup).toContain('aria-label="Next candle"')
  expect(markup).toContain('title="Next candle"')
  expect(markup).toContain('aria-label="Replay speed"')
  expect(markup).toContain('class="alignment-icon-control" aria-label="Play replay"')
  expect(markup).toContain('class="alignment-icon-control" aria-label="Next candle"')
  expect(markup).toContain('Paused · all charts · step 5m')
 })

 it.each([
  ['live','● Live · Binance USD-M'],
  ['stale','● Stale data · reconnecting'],
  ['connecting','● Connecting / syncing candles…'],
 ] as const)('renders the %s Live state', (health,label)=>{
  const markup=renderToStaticMarkup(createElement(LiveTransport,{health,updated:null}))
  expect(markup).toContain(label)
 })

 it('offers Off, Weak, and Strong and marks the persistent magnet selection',()=>{
  const markup=renderToStaticMarkup(createElement(WorkspaceMagnetMenu,{
   open:true,magnet:'weak',onChange:noop,onClose:noop,
  }))
  expect(markup).toContain('role="menu" aria-label="Magnet mode"')
  expect(markup).toMatch(/role="menuitemradio"[^>]*aria-checked="false"[^>]*>Off/)
  expect(markup).toMatch(/role="menuitemradio"[^>]*aria-checked="true"[^>]*>Weak/)
  expect(markup).toMatch(/role="menuitemradio"[^>]*aria-checked="false"[^>]*>Strong/)
  expect(markup).not.toContain('Cmd/Ctrl')
 })

 it('wraps arrow navigation and supports Home and End',()=>{
  expect(menuFocusIndex('ArrowDown',2,3)).toBe(0)
  expect(menuFocusIndex('ArrowUp',0,3)).toBe(2)
  expect(menuFocusIndex('Home',2,3)).toBe(0)
  expect(menuFocusIndex('End',0,3)).toBe(2)
  expect(menuFocusIndex('Enter',1,3)).toBeNull()
 })
})

describe('workspace settings and licenses',()=>{
 it('keeps chart settings and About & licenses inside the Settings menu',()=>{
  const markup=renderToStaticMarkup(createElement(WorkspaceSettingsMenu,{
   open:true,onOpenChartSettings:noop,onOpenAbout:noop,
  }))
  expect(markup).toContain('role="menu" aria-label="Settings"')
  expect(markup).toContain('Chart settings')
  expect(markup).toContain('About &amp; licenses')
 })

 it('shows the OpenCharts license link only inside the About dialog',()=>{
  const closed=renderToStaticMarkup(createElement(WorkspaceAboutDialog,{open:false,onClose:noop}))
  const open=renderToStaticMarkup(createElement(WorkspaceAboutDialog,{open:true,onClose:noop}))
  expect(closed).toBe('')
  expect(open).toContain('About &amp; licenses')
  expect(open).toContain('OpenCharts · MIT')
  expect(open).toContain('Lightweight Charts · Apache 2.0')
 })
})

describe('workspace shell compatibility',()=>{
 it('renders uniquely named cell controls only for a multi-chart workspace',()=>{
  const props={index:2,symbol:'ETHUSDT' as const,timeframe:'15m' as const,mode:'replay' as const,onActivate:noop,onMaximize:noop}
  const single=shouldShowCellCaption(1,false)?renderToStaticMarkup(createElement(CellCaption,props)):''
  const multiple=shouldShowCellCaption(2,false)?renderToStaticMarkup(createElement(CellCaption,props)):''
  expect(single).toBe('')
  expect(multiple).toContain('aria-label="Activate chart 2"')
  expect(multiple).toContain('aria-label="Maximize chart 2"')
  expect(multiple).toContain('title="Maximize chart 2"')
  expect(multiple).toContain('ETHUSDT')
  expect(multiple).toContain('15m · REPLAY')
 })

 it('shows cell captions only when multiple cells are visible',()=>{
  expect(shouldShowCellCaption(1,false)).toBe(false)
  expect(shouldShowCellCaption(2,false)).toBe(true)
  expect(shouldShowCellCaption(1,true)).toBe(false)
 })

 it('preserves the existing workspace backup payload keys and values',()=>{
  const workspace=initialWorkspace()
  const drawings:DrawingStore={}
  const input={workspace,liveWorkspace:workspace.cells,drawings,magnet:'strong' as const,stay:true}
  expect(createWorkspaceBackup(input)).toEqual({
   workspace:input.workspace,
   liveWorkspace:input.liveWorkspace,
   drawings:input.drawings,
   magnet:input.magnet,
   stay:input.stay,
  })
 })

 it('preserves multi-point and curve geometry through a JSON backup roundtrip',()=>{
  const workspace=initialWorkspace()
  const drawings:DrawingStore={
   'chart-1:replay:BTCUSDT':[
    {asOf:Date.UTC(2023,0,8),drawing:{id:'path-1',type:'path',price:16500,time:1673135400,color:'#2962ff',points:[{time:1673135400,price:16500},{time:1673135460,price:16525}]}},
    {asOf:Date.UTC(2023,0,8),drawing:{id:'curve-1',type:'curve',price:16480,price2:16600,time:1673135400,time2:1673136000,controlTime:1673135700,controlPrice:16640,color:'#e040fb'}},
   ],
  }
  const backup=createWorkspaceBackup({workspace,liveWorkspace:workspace.cells,drawings,magnet:'weak',stay:false})
  expect(JSON.parse(JSON.stringify(backup)).drawings).toEqual(drawings)
 })

 it('preserves legacy drawings and every native settings field through a JSON backup roundtrip',()=>{
  const workspace=initialWorkspace()
  const rules={ticks:true,seconds:false,minutes:true,hours:false,days:true,weeks:false,months:true,ranges:false}
  const drawings:DrawingStore={
   'chart-1:replay:BTCUSDT':[
    {asOf:Date.UTC(2023,0,8),drawing:{id:'legacy-1',type:'trendline',price:16500,price2:16600,time:1673135400,time2:1673136000,color:'#2962ff'}},
    {asOf:Date.UTC(2023,0,8),drawing:{
     id:'position-1',name:'Primary setup',type:'position',side:'long',price:16500,time:1673135400,time2:1673136000,color:'#787b86',
     stopPrice:16250,targetPrice:17250,opacity:.9,fillColor:'#2962ff',fillOpacity:.14,secondaryColor:'#b2b5be',secondaryWidth:1,secondaryLineStyle:'dashed',
     text:'Breakout',fontSize:12,bold:true,italic:false,textAlign:'center',textPlacement:'inside',positiveColor:'#089981',negativeColor:'#f23645',labelColor:'#ffffff',rangeLabelMode:'full',
     accountSize:10000,lotSize:1,leverage:10,riskValue:1,riskUnit:'percent',quantityPrecision:2,tickSize:.1,stopColor:'#f23645',targetColor:'#089981',stopFillOpacity:.2,targetFillOpacity:.2,
     showPriceLabels:true,statsMode:'price-offsets',compactStats:false,alwaysShowStats:true,visibility:'tf',createdTf:'5m',visibilityRules:rules,
    }},
    {asOf:Date.UTC(2023,0,8),drawing:{id:'brush-1',type:'brush',price:16400,time:1673135400,color:'#e040fb',smooth:true,closed:true,points:[{time:1673135400,price:16400},{time:1673135460,price:16450}]}},
   ],
  }
  const backup=createWorkspaceBackup({workspace,liveWorkspace:workspace.cells,drawings,magnet:'strong',stay:true})
  expect(JSON.parse(JSON.stringify(backup)).drawings).toEqual(drawings)
 })
})
