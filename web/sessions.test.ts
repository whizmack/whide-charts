import { expect, it } from 'vitest'
import { visibleDrawing } from './sessions'

it('does not reveal a drawing created later in the session', () => {
  expect(visibleDrawing(true, 2000, 1000)).toBe(false)
  expect(visibleDrawing(true, 2000, 2000)).toBe(true)
})
it('does not unhide a deliberately hidden drawing', () => {
  expect(visibleDrawing(false, 1000, 2000)).toBe(false)
})
