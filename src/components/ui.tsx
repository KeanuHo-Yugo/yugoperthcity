import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Priority, Staff } from '@/data/fixtures'

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const toneClasses = {
  teal: 'bg-brand-50 text-brand-700 ring-brand-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-800 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
} as const
export type Tone = keyof typeof toneClasses

export function Badge({ tone = 'slate', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', toneClasses[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export const priorityTone: Record<Priority, Tone> = {
  Low: 'slate',
  Medium: 'teal',
  High: 'orange',
  Urgent: 'red',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={priorityTone[priority]} dot>{priority}</Badge>
}

export function statusTone(status: string): Tone {
  switch (status) {
    case 'Completed':
    case 'Done':
    case 'Passed':
    case 'Resolved':
    case 'Approved':
      return 'green'
    case 'In Progress':
    case 'Investigating':
    case 'Review':
      return 'teal'
    case 'Failed':
    case 'Overdue':
    case 'Declined':
      return 'red'
    case 'Re-inspection Required':
    case 'Awaiting follow-up':
    case 'Missing ID':
    case 'Awaiting contract':
      return 'amber'
    default:
      return 'slate'
  }
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}

const avatarColors = ['bg-brand-500', 'bg-violet-500', 'bg-orange-500', 'bg-sky-600', 'bg-rose-500', 'bg-emerald-600', 'bg-slate-600', 'bg-amber-600']

export function Avatar({ person, size = 'md' }: { person?: Staff; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' }
  if (!person) {
    return <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-ink-muted text-ink-muted', sizes[size])}>?</span>
  }
  const color = avatarColors[Number(person.id.slice(1)) % avatarColors.length]
  return (
    <span title={person.name} className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', color, sizes[size])}>
      {person.initials}
    </span>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl scroll-thin', wide ? 'sm:max-w-3xl' : 'sm:max-w-xl')}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-ink-muted">{hint}</span> : null}
    </label>
  )
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-white p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx('inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition', value === o.value ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-soft hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span className="mt-0.5 font-bold">Demo</span>
      <span>{children}</span>
    </div>
  )
}
