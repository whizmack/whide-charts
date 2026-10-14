import { useEffect, useRef, type ReactNode } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close() }, [])
  return <dialog ref={ref} className="dialog" onCancel={onClose} aria-labelledby="dialog-title">
    <header><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Cross2Icon /></button></header>
    <div className="dialog-content">{children}</div>
  </dialog>
}
