import type { DrawingsDocument, InputValue } from '@luxalgo/vela'
import type { Selection, Symbol } from './replay'

export type ChartSnapshot = {
  drawings: DrawingsDocument
  indicators: { type: string; inputs: Record<string, InputValue>; visible: boolean }[]
  viewport: { from: number; to: number } | null
  renderer?: unknown
}
export type Session = {
  schemaVersion: 1
  selection: Selection
  datasetVersion: string
  speed: number
  chartsBySymbol: Partial<Record<Symbol, ChartSnapshot>>
  drawingsCreatedAt: Record<string, number>
}

export function visibleDrawing(original: boolean, createdAsOf: number | undefined, asOf: number) {
  return original && (createdAsOf === undefined || createdAsOf <= asOf)
}

export function downloadSession(session: Session) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `perp-replay-session-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
