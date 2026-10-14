import { useLayoutEffect, useRef } from 'react'
import type { Bar } from './api'
import { ChartBridge } from './chartBridge'
import type { Selection } from './replay'
import type { Session } from './sessions'

export function Chart({ selection, bars, restored, onReady, onChange, renderKey, onPainted }: {
  selection: Selection; bars: Bar[]; restored: Session | null
  onReady: (bridge: ChartBridge) => void; onChange: () => void
  renderKey: string; onPainted: (key: string) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const bridge = useRef<ChartBridge | null>(null)
  const initial = useRef({ selection, bars, restored })
  useLayoutEffect(() => {
    const { selection, bars, restored } = initial.current
    const instance = new ChartBridge(host.current!, selection, bars, onChange, restored)
    bridge.current = instance
    onReady(instance)
    return () => { bridge.current = null; instance.destroy() }
  }, [onReady, onChange])
  useLayoutEffect(() => {
    let active = true
    if (bridge.current) void bridge.current.update(selection, bars).then(() => { if (active) onPainted(renderKey) })
    return () => { active = false }
  }, [selection, bars, renderKey, onPainted])
  return <div className="chart-surface" ref={host} aria-label="Historický cenový graf" />
}
