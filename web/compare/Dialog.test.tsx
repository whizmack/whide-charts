import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it,vi} from 'vitest'
import {Dialog} from './Dialog'

it('renders an accessible native dialog for OpenCharts settings',()=>{
 const markup=renderToStaticMarkup(createElement(Dialog,{title:'RSI settings',onClose:vi.fn(),children:createElement('p',null,'Study inputs')}))
 expect(markup).toContain('<dialog')
 expect(markup).toContain('aria-labelledby="dialog-title"')
 expect(markup).toContain('<h2 id="dialog-title">RSI settings</h2>')
 expect(markup).toContain('aria-label="Close"')
 expect(markup).toContain('Study inputs')
})
