import {renderToStaticMarkup} from 'react-dom/server'
import {describe,expect,it,vi} from 'vitest'
import {StudyLinePopover,StudySettingsDialog} from './StudySettings'
import {defaultStudy} from './studies'

describe('indicator line controls',()=>{
 it('marks the configured thickness and line style as selected',()=>{
  const markup=renderToStaticMarkup(<StudyLinePopover width={3} style="dotted" onWidthChange={vi.fn()} onStyleChange={vi.fn()}/>)

  expect(markup).toContain('aria-label="Thickness"')
  expect(markup).toMatch(/<button[^>]*aria-label="3 px"[^>]*aria-pressed="true"/)
  expect(markup).toContain('aria-label="Line style"')
  expect(markup).toMatch(/<button[^>]*aria-label="Dotted"[^>]*aria-pressed="true"/)
 })
})

it('matches the TradingView indicator settings title',()=>{
 const markup=renderToStaticMarkup(<StudySettingsDialog type="EMA" value={defaultStudy('EMA')} onSave={vi.fn()} onClose={vi.fn()}/> )
 expect(markup).toContain('<h2 id="dialog-title">EMA settings</h2>')
})
