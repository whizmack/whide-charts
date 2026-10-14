import { useEffect, useState } from 'react'
import { DownloadIcon } from '@radix-ui/react-icons'
import { api, type ImportJob, type Markets } from './api'

const yesterday = () => new Date(Date.now()-86400000).toISOString().slice(0, 10)

export function DataPanel({ markets, onRefresh }: { markets: Markets | null; onRefresh: () => void }) {
  const [start, setStart] = useState('2023-01-01')
  const [end, setEnd] = useState(yesterday())
  const [job, setJob] = useState<ImportJob | null>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  useEffect(() => {
    if (!job || job.status !== 'running') return
    const timer = setTimeout(() => {
      void api<ImportJob>(`/imports/${job.id}`).then(next => {
        setJob(next)
        if (next.status !== 'running') onRefresh()
      }).catch(e => setError(String(e.message)))
    }, 1500)
    return () => clearTimeout(timer)
  }, [job, onRefresh])
  async function download(event: React.FormEvent) {
    event.preventDefault(); setStarting(true); setError('')
    try {
      setJob(await api<ImportJob>('/imports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ start, end }) }))
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setStarting(false) }
  }
  return <>
    <p className="helper">Binance USD-M perpetual · 1m data. Vyšší timeframes vznikají ze stejné historie. Po stažení funguje graf offline.</p>
    <div className="coverage">{markets?.markets.map(m => <div key={m.symbol}><strong>{m.symbol}</strong><span>{m.ranges.length ? m.ranges.map(r => `${new Date(r.start).toISOString().slice(0,10)} — ${new Date(r.end-60000).toISOString().slice(0,10)}`).join(', ') : 'Zatím bez dat'}</span><small>{m.rows.toLocaleString('cs-CZ')} minutových svíček{m.ranges.length > 1 ? ' · historie obsahuje mezery' : ''}</small></div>)}</div>
    <button className="quiet" onClick={onRefresh}>Použít aktuální historii</button>
    <h3>Doplnit historii</h3>
    <form onSubmit={download}>
      <div className="field-pair"><label>Od<input type="date" min="2023-01-01" max={end} value={start} onChange={e => setStart(e.target.value)} required /></label><label>Do<input type="date" min={start} max={yesterday()} value={end} onChange={e => setEnd(e.target.value)} required /></label></div>
      <p className="helper">Stáhnou se všechny tři páry. Existující archivy se přeskočí. Nejnovější den může být ještě nedostupný.</p>
      <button className="primary" type="submit" disabled={starting || job?.status === 'running'}><DownloadIcon />{starting ? 'Spouštím import…' : 'Stáhnout historii'}</button>
    </form>
    {job ? <div className="job" role="status"><strong>{job.status === 'running' ? 'Stahuji historii' : job.status === 'complete' ? 'Historie doplněna' : 'Import dokončen s chybami'}</strong><progress value={job.done} max={job.total} /><span>{job.done} / {job.total} archivů · {job.current}</span>{job.errors.map((e, i) => <p className="error-text" key={i}>{e.symbol} {e.period}: {e.message}</p>)}</div> : null}
    {error ? <p className="error-text" role="alert">{error}</p> : null}
    <p className="terms">Zdroj: <a href="https://data.binance.vision/" target="_blank" rel="noreferrer">Binance Vision</a>. Dataset pro osobní výzkum podléhá <a href="https://github.com/binance/binance-public-data/blob/master/TERMS_AND_CONDITIONS.md" target="_blank" rel="noreferrer">podmínkám Binance</a>.</p>
  </>
}
