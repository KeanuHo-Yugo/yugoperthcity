import { useMemo, useState, type ReactNode } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { PageHeader, cx } from './ui'

export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string }

/**
 * Read-only preview of a module that is scheduled for a later milestone:
 * a searchable table over demo fixtures plus a list of what the full module adds.
 */
export function ModulePreview<T>({
  title,
  description,
  rows,
  columns,
  searchText,
  filters,
  upcoming,
  summary,
}: {
  title: string
  description: string
  rows: T[]
  columns: Column<T>[]
  searchText: (row: T) => string
  filters?: { label: string; options: string[]; value: (row: T) => string }[]
  upcoming: string[]
  summary?: ReactNode
}) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState<Record<string, string>>({})

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase()
    return rows.filter(
      (r) =>
        (!term || searchText(r).toLowerCase().includes(term)) &&
        (filters ?? []).every((f) => !active[f.label] || f.value(r) === active[f.label]),
    )
  }, [rows, q, active, filters, searchText])

  return (
    <div>
      <PageHeader title={title} description={description} />
      {summary}
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} />
            </div>
            {filters?.map((f) => (
              <select
                key={f.label}
                className="input sm:w-44"
                aria-label={f.label}
                value={active[f.label] ?? ''}
                onChange={(e) => setActive((a) => ({ ...a, [f.label]: e.target.value }))}
              >
                <option value="">All {f.label.toLowerCase()}</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
                <tr>{columns.map((c) => <th key={c.header} className={cx('whitespace-nowrap px-4 py-3', c.className)}>{c.header}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((r, i) => (
                  <tr key={i} className="hover:bg-canvas/70">
                    {columns.map((c) => <td key={c.header} className={cx('px-4 py-3', c.className)}>{c.cell(r)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {visible.length === 0 && <p className="px-4 py-10 text-center text-sm text-ink-muted">No records match.</p>}
          </div>
          <p className="border-t border-line px-4 py-3 text-xs text-ink-muted">{visible.length} of {rows.length} records · sample data</p>
        </div>

        <aside className="card h-fit p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-700"><Sparkles className="h-4 w-4" /> Coming to this module</p>
          <ul className="mt-3 space-y-2.5">
            {upcoming.map((u) => (
              <li key={u} className="flex gap-2.5 text-sm text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {u}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}

export function MiniStats({ items }: { items: { label: string; value: number | string; tone?: 'red' | 'amber' }[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="card px-4 py-3">
          <p className="text-xs font-semibold text-ink-muted">{s.label}</p>
          <p className={cx('mt-0.5 text-xl font-extrabold', s.tone === 'red' ? 'text-red-600' : s.tone === 'amber' ? 'text-amber-700' : 'text-ink')}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
