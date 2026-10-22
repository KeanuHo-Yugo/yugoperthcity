import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownUp,
  Camera,
  CheckCircle2,
  Clock,
  Download,
  ImageIcon,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import { dayOffset, maintenanceCategories, staff, type MaintenanceRequest, type MaintenanceStatus, type Priority } from '@/data/fixtures'
import { addMaintenance, staffById, updateMaintenance, useCurrentUser, usePortal } from '@/data/store'
import { seesOnlyOwnWork } from '@/lib/permissions'
import { formatDate, isOverdue, relativeDay, timeAgo } from '@/lib/format'
import { downloadCsv } from '@/lib/csv'
import { Avatar, Badge, Field, Modal, PageHeader, PriorityBadge, Segmented, StatusBadge, cx } from '@/components/ui'

export const Route = createFileRoute('/maintenance')({
  validateSearch: (search: Record<string, unknown>): { new?: boolean } => ({
    new: search.new === true || search.new === 'true' ? true : undefined,
  }),
  head: () => ({ meta: [{ title: 'Maintenance · Yugo Ops' }] }),
  component: MaintenancePage,
})

const statuses: MaintenanceStatus[] = ['Pending', 'In Progress', 'Completed']
const priorities: Priority[] = ['Urgent', 'High', 'Medium', 'Low']
const priorityRank: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 }
type SortKey = 'id' | 'room' | 'priority' | 'dueDate' | 'status'

const managesAssignments = (role: string) => role === 'admin' || role === 'manager' || role === 'reception'

function MaintenancePage() {
  const { new: openNew } = Route.useSearch()
  const navigate = useNavigate({ from: '/maintenance' })
  const user = useCurrentUser()
  const all = usePortal((s) => s.maintenance)

  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | MaintenanceStatus>('all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [assignee, setAssignee] = useState<string>('all')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'priority', dir: 1 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const own = seesOnlyOwnWork(user.role)
  const visible = own ? all.filter((m) => m.assigneeId === user.id) : all

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase()
    return visible
      .filter((m) => (tab === 'history' ? m.status === 'Completed' : m.status !== 'Completed'))
      .filter((m) => status === 'all' || m.status === status)
      .filter((m) => priority === 'all' || m.priority === priority)
      .filter((m) => assignee === 'all' || (assignee === 'none' ? !m.assigneeId : m.assigneeId === assignee))
      .filter((m) => category === 'all' || m.category === category)
      .filter((m) => !term || `${m.id} ${m.room} ${m.title} ${m.description} ${m.category}`.toLowerCase().includes(term))
      .sort((a, b) => {
        const k = sort.key
        const av = k === 'priority' ? priorityRank[a.priority] : k === 'status' ? statuses.indexOf(a.status) : a[k]
        const bv = k === 'priority' ? priorityRank[b.priority] : k === 'status' ? statuses.indexOf(b.status) : b[k]
        if (av === bv) return a.dueDate < b.dueDate ? -1 : 1
        return (av < bv ? -1 : 1) * sort.dir
      })
  }, [visible, tab, q, status, priority, assignee, category, sort])

  const active = visible.filter((m) => m.status !== 'Completed')
  const counts = {
    pending: active.filter((m) => m.status === 'Pending').length,
    progress: active.filter((m) => m.status === 'In Progress').length,
    urgent: active.filter((m) => m.priority === 'Urgent').length,
    overdue: active.filter((m) => isOverdue(m.dueDate, false)).length,
    unassigned: active.filter((m) => !m.assigneeId).length,
  }

  const selected = all.find((m) => m.id === selectedId) ?? null
  const canExport = user.role === 'admin' || user.role === 'manager'

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))
  const closeNew = () => navigate({ search: {} })

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description={own ? 'Jobs assigned to you. Update progress as you go.' : 'Log, assign and track maintenance requests across the building.'}
        actions={
          <>
            {canExport && (
              <button
                className="btn-ghost"
                onClick={() =>
                  downloadCsv(
                    `maintenance-${tab}.csv`,
                    rows.map((m) => ({
                      ID: m.id, Room: m.room, Category: m.category, Title: m.title, Priority: m.priority, Status: m.status,
                      Assignee: staffById(m.assigneeId)?.name ?? 'Unassigned', Created: m.createdAt, Due: m.dueDate, Completed: m.completedAt ?? '',
                    })),
                  )
                }
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
            <button className="btn-primary" onClick={() => navigate({ search: { new: true } })}>
              <Plus className="h-4 w-4" /> New request
            </button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryChip label="Pending" value={counts.pending} onClick={() => { setTab('active'); setStatus('Pending') }} />
        <SummaryChip label="In progress" value={counts.progress} onClick={() => { setTab('active'); setStatus('In Progress') }} />
        <SummaryChip label="Urgent" value={counts.urgent} tone="red" onClick={() => { setTab('active'); setPriority('Urgent') }} />
        <SummaryChip label="Overdue" value={counts.overdue} tone="red" />
        {!own && <SummaryChip label="Unassigned" value={counts.unassigned} tone="amber" onClick={() => { setTab('active'); setAssignee('none') }} />}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <Segmented
            value={tab}
            onChange={(v) => { setTab(v); setStatus('all') }}
            options={[
              { value: 'active', label: <>Active <span className="opacity-70">{active.length}</span></> },
              { value: 'history', label: <>History <span className="opacity-70">{visible.length - active.length}</span></> },
            ]}
          />
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by room, ID or issue…" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {tab === 'active' && (
              <select className="input sm:w-36" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
                <option value="all">All statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
              </select>
            )}
            <select className="input sm:w-36" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} aria-label="Priority">
              <option value="all">All priorities</option>
              {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
            <select className="input sm:w-40" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {maintenanceCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
            {!own && (
              <select className="input sm:w-40" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
                <option value="all">Anyone</option>
                <option value="none">Unassigned</option>
                {staff.filter((s) => s.role === 'maintenance').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
              <tr>
                <SortTh label="Request" k="id" sort={sort} onSort={toggleSort} />
                <SortTh label="Room" k="room" sort={sort} onSort={toggleSort} />
                <SortTh label="Priority" k="priority" sort={sort} onSort={toggleSort} />
                <SortTh label="Status" k="status" sort={sort} onSort={toggleSort} />
                <th className="px-4 py-3">Assigned</th>
                <SortTh label={tab === 'history' ? 'Completed' : 'Due'} k="dueDate" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((m) => {
                const overdue = isOverdue(m.dueDate, m.status === 'Completed')
                const person = staffById(m.assigneeId)
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={cx('cursor-pointer transition hover:bg-brand-50/50', (m.priority === 'Urgent' || overdue) && m.status !== 'Completed' && 'bg-red-50/40')}
                  >
                    <td className="max-w-[360px] px-4 py-3">
                      <p className="truncate font-semibold text-ink">{m.title}</p>
                      <p className="text-xs text-ink-muted">
                        {m.id} · {m.category}
                        {m.photos.length > 0 && <span className="ml-1.5 inline-flex items-center gap-0.5"><Camera className="h-3 w-3" />{m.photos.length}</span>}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{m.room}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={m.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3">
                      {person ? (
                        <span className="flex items-center gap-2"><Avatar person={person} size="sm" /><span className="whitespace-nowrap">{person.name}</span></span>
                      ) : (
                        <Badge tone="amber">Unassigned</Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {m.status === 'Completed' ? (
                        <span className="text-ink-soft">{formatDate(m.completedAt ?? m.dueDate)}</span>
                      ) : (
                        <span className={cx('font-semibold', overdue ? 'text-red-600' : 'text-ink-soft')}>
                          {overdue && <Clock className="mr-1 inline h-3.5 w-3.5" />}
                          {relativeDay(m.dueDate)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="divide-y divide-line md:hidden">
          {rows.map((m) => {
            const overdue = isOverdue(m.dueDate, m.status === 'Completed')
            return (
              <li key={m.id}>
                <button onClick={() => setSelectedId(m.id)} className="w-full px-4 py-3 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{m.title}</p>
                    <PriorityBadge priority={m.priority} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink">Room {m.room}</span>·<StatusBadge status={m.status} />·
                    <span className={cx(overdue && 'font-semibold text-red-600')}>{m.status === 'Completed' ? 'Done' : relativeDay(m.dueDate)}</span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {rows.length === 0 && (
          <div className="px-4 py-14 text-center">
            <Wrench className="mx-auto h-8 w-8 text-ink-muted" />
            <p className="mt-2 font-semibold">No requests match these filters</p>
            <p className="text-sm text-ink-muted">Try clearing the search or choosing a different status.</p>
          </div>
        )}
        <div className="border-t border-line px-4 py-3 text-xs text-ink-muted">
          Showing {rows.length} of {tab === 'active' ? active.length : visible.length - active.length} requests
        </div>
      </div>

      <NewRequestModal open={!!openNew} onClose={closeNew} onCreated={(id) => { closeNew(); setTab('active'); setSelectedId(id) }} />
      {selected && <RequestDetail request={selected} onClose={() => setSelectedId(null)} canAssign={managesAssignments(user.role)} />}
    </div>
  )
}

function SummaryChip({ label, value, tone = 'teal', onClick }: { label: string; value: number; tone?: 'teal' | 'red' | 'amber'; onClick?: () => void }) {
  const colors = { teal: 'text-brand-700', red: 'text-red-600', amber: 'text-amber-700' }
  return (
    <button onClick={onClick} disabled={!onClick} className="card flex items-center justify-between px-4 py-3 text-left transition enabled:hover:border-brand-200 disabled:cursor-default">
      <span className="text-sm font-semibold text-ink-soft">{label}</span>
      <span className={cx('text-xl font-extrabold', value > 0 ? colors[tone] : 'text-ink-muted')}>{value}</span>
    </button>
  )
}

function SortTh({ label, k, sort, onSort }: { label: string; k: SortKey; sort: { key: SortKey; dir: 1 | -1 }; onSort: (k: SortKey) => void }) {
  return (
    <th className="px-4 py-3">
      <button onClick={() => onSort(k)} className={cx('inline-flex items-center gap-1 uppercase tracking-wider hover:text-ink', sort.key === k && 'text-brand-700')}>
        {label}
        <ArrowDownUp className="h-3 w-3" />
      </button>
    </th>
  )
}

type FormState = {
  room: string
  title: string
  category: string
  priority: Priority | ''
  description: string
  assigneeId: string
  dueDate: string
  photos: string[]
}

const emptyForm = (): FormState => ({ room: '', title: '', category: '', priority: '', description: '', assigneeId: '', dueDate: '', photos: [] })

function validate(f: FormState) {
  const e: Partial<Record<keyof FormState, string>> = {}
  if (!f.room.trim()) e.room = 'Enter a room number or area, e.g. 1204 or Gym.'
  else if (/^\d+$/.test(f.room.trim()) && !/^\d{4}$/.test(f.room.trim())) e.room = 'Room numbers have 4 digits, e.g. 0815.'
  if (f.title.trim().length < 5) e.title = 'Give the issue a short title (at least 5 characters).'
  if (!f.category) e.category = 'Choose a category.'
  if (!f.priority) e.priority = 'Choose a priority.'
  if (f.description.trim().length < 15) e.description = 'Describe the issue in a little more detail (at least 15 characters).'
  if (!f.dueDate) e.dueDate = 'Set a target date.'
  return e
}

const defaultDue: Record<Priority, number> = { Urgent: 0, High: 1, Medium: 3, Low: 7 }

function NewRequestModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [submitted, setSubmitted] = useState(false)
  const all = usePortal((s) => s.maintenance)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    const next = { ...form, [k]: v }
    if (k === 'priority' && v && !form.dueDate) {
      next.dueDate = dayOffset(defaultDue[v as Priority])
    }
    setForm(next)
    if (submitted) setErrors(validate(next))
  }

  // Warn about likely duplicates: an open request for the same room and category.
  const duplicate = form.room.trim() && form.category
    ? all.find((m) => m.status !== 'Completed' && m.room.toLowerCase() === form.room.trim().toLowerCase() && m.category === form.category)
    : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const id = addMaintenance({
      room: form.room.trim(),
      title: form.title.trim(),
      category: form.category,
      priority: form.priority as Priority,
      description: form.description.trim(),
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate,
      photos: form.photos,
    })
    setForm(emptyForm())
    setSubmitted(false)
    onCreated(id)
  }

  return (
    <Modal open={open} onClose={onClose} title="New maintenance request">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Room or area" error={errors.room}>
            <input className="input" value={form.room} onChange={(e) => set('room', e.target.value)} placeholder="e.g. 1204" />
          </Field>
          <Field label="Category" error={errors.category}>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select…</option>
              {maintenanceCategories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        {duplicate && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Possible duplicate: <strong>{duplicate.id}</strong> “{duplicate.title}” is already open for this room and category.
          </div>
        )}
        <Field label="Issue title" error={errors.title}>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Shower draining slowly" />
        </Field>
        <Field label="Description" error={errors.description}>
          <textarea className="input min-h-24" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What’s happening, where exactly, and anything already tried." />
        </Field>
        <Field label="Priority" error={errors.priority}>
          <div className="grid grid-cols-4 gap-2">
            {priorities.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => set('priority', p)}
                className={cx(
                  'rounded-xl border px-2 py-2 text-sm font-semibold transition',
                  form.priority === p ? (p === 'Urgent' ? 'border-red-500 bg-red-50 text-red-700' : 'border-brand-500 bg-brand-50 text-brand-700') : 'border-line text-ink-soft hover:bg-canvas',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assign to" hint="Leave unassigned for a manager to triage.">
            <select className="input" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              <option value="">Unassigned</option>
              {staff.filter((s) => s.role === 'maintenance').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Target date" error={errors.dueDate}>
            <input type="date" className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </div>
        <Field label="Photos" hint="Photos are previewed in this browser only until file storage is connected.">
          <div className="flex flex-wrap gap-2">
            {form.photos.map((p) => (
              <img key={p} src={p} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-line" />
            ))}
            <span className="grid h-16 w-16 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-line text-ink-muted hover:border-brand-300 hover:text-brand-600">
              <Camera className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  set('photos', [...form.photos, ...files.map((f) => URL.createObjectURL(f))])
                }}
              />
            </span>
          </div>
        </Field>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Submit request</button>
        </div>
      </form>
    </Modal>
  )
}

function RequestDetail({ request: m, onClose, canAssign }: { request: MaintenanceRequest; onClose: () => void; canAssign: boolean }) {
  const [note, setNote] = useState('')
  const overdue = isOverdue(m.dueDate, m.status === 'Completed')
  const reporter = staffById(m.reportedById)

  return (
    <Modal open onClose={onClose} title={`${m.id} · Room ${m.room}`} wide>
      <div className="grid gap-6 md:grid-cols-5">
        <div className="space-y-5 md:col-span-3">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <PriorityBadge priority={m.priority} />
              <StatusBadge status={m.status} />
              <Badge>{m.category}</Badge>
              {overdue && <Badge tone="red">Overdue</Badge>}
            </div>
            <h3 className="text-lg font-bold">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.description}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Update status</p>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => s !== m.status && updateMaintenance(m.id, { status: s }, `Status changed to ${s}`)}
                  className={cx(
                    'flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition',
                    m.status === s ? 'border-brand-500 bg-brand-500 text-white' : 'border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50',
                  )}
                >
                  {s === 'Completed' && <CheckCircle2 className="h-4 w-4" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Photos</p>
            {m.photos.length === 0 ? (
              <p className="text-sm text-ink-muted">No photos attached.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {m.photos.map((p) =>
                  p.startsWith('blob:') ? (
                    <img key={p} src={p} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-line" />
                  ) : (
                    <span key={p} className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl bg-canvas text-[11px] text-ink-muted ring-1 ring-line">
                      <ImageIcon className="h-5 w-5" />
                      {p}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!note.trim()) return
              updateMaintenance(m.id, {}, `Note: ${note.trim()}`)
              setNote('')
            }}
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Add a note</p>
            <div className="flex gap-2">
              <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Parts ordered, back Thursday" />
              <button className="btn-primary shrink-0" disabled={!note.trim()}>Add</button>
            </div>
          </form>
        </div>

        <div className="space-y-5 md:col-span-2">
          <dl className="space-y-3 rounded-2xl bg-canvas p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-muted">Assigned to</dt>
              <dd>
                {canAssign ? (
                  <select
                    className="input py-1.5"
                    value={m.assigneeId ?? ''}
                    onChange={(e) => {
                      const id = e.target.value || null
                      updateMaintenance(m.id, { assigneeId: id }, id ? `Assigned to ${staffById(id)?.name}` : 'Unassigned')
                    }}
                  >
                    <option value="">Unassigned</option>
                    {staff.filter((s) => s.role === 'maintenance').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                ) : (
                  <span className="font-semibold">{staffById(m.assigneeId)?.name ?? 'Unassigned'}</span>
                )}
              </dd>
            </div>
            <Row label="Reported by" value={reporter?.name ?? '—'} />
            <Row label="Logged" value={formatDate(m.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })} />
            <Row label="Target date" value={<span className={cx(overdue && 'font-bold text-red-600')}>{formatDate(m.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>} />
            {m.completedAt && <Row label="Completed" value={formatDate(m.completedAt, { day: 'numeric', month: 'short', year: 'numeric' })} />}
          </dl>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">History</p>
            <ol className="relative space-y-3 border-l border-line pl-4">
              {[...m.history].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
                  <p className="text-sm">{h.text}</p>
                  <p className="text-xs text-ink-muted" suppressHydrationWarning>
                    {staffById(h.by)?.name} · {timeAgo(h.at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

