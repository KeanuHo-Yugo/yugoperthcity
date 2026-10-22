import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, KanbanSquare, Plus, Search } from 'lucide-react'
import { staff, today, type Priority, type StaffTask, type TaskStatus } from '@/data/fixtures'
import { addTask, staffById, updateTask, useCurrentUser, usePortal } from '@/data/store'
import { seesOnlyOwnWork } from '@/lib/permissions'
import { formatDate, isOverdue, relativeDay, timeAgo } from '@/lib/format'
import { Avatar, Badge, Field, Modal, PageHeader, PriorityBadge, Segmented, StatusBadge, cx, priorityTone } from '@/components/ui'

export const Route = createFileRoute('/tasks')({
  validateSearch: (search: Record<string, unknown>): { new?: boolean } => ({
    new: search.new === true || search.new === 'true' ? true : undefined,
  }),
  head: () => ({ meta: [{ title: 'Staff Tasks · Yugo Ops' }] }),
  component: TasksPage,
})

const columns: { status: TaskStatus; hint: string }[] = [
  { status: 'To Do', hint: 'Not started' },
  { status: 'In Progress', hint: 'Being worked on' },
  { status: 'Review', hint: 'Waiting for sign-off' },
  { status: 'Done', hint: 'Completed' },
]
const priorities: Priority[] = ['Urgent', 'High', 'Medium', 'Low']
const categories = ['Reception', 'Cleaning', 'Maintenance', 'Compliance', 'Management']
const priorityBar: Record<Priority, string> = { Urgent: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-brand-500', Low: 'bg-slate-300' }

const canAssignTasks = (role: string) => role === 'admin' || role === 'manager' || role === 'reception'

function TasksPage() {
  const { new: openNew } = Route.useSearch()
  const navigate = useNavigate({ from: '/tasks' })
  const user = useCurrentUser()
  const all = usePortal((s) => s.tasks)
  const own = seesOnlyOwnWork(user.role)

  const [view, setView] = useState<'board' | 'calendar'>('board')
  const [q, setQ] = useState('')
  const [assignee, setAssignee] = useState(own ? user.id : 'all')
  const [priority, setPriority] = useState<'all' | Priority>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)

  const tasks = useMemo(() => {
    const term = q.trim().toLowerCase()
    return all
      .filter((t) => !own || t.assigneeId === user.id)
      .filter((t) => own || assignee === 'all' || t.assigneeId === assignee)
      .filter((t) => priority === 'all' || t.priority === priority)
      .filter((t) => !overdueOnly || isOverdue(t.dueDate, t.status === 'Done'))
      .filter((t) => !term || `${t.id} ${t.title} ${t.description} ${t.category}`.toLowerCase().includes(term))
  }, [all, own, user.id, assignee, priority, overdueOnly, q])

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status === 'Done')).length
  const selected = all.find((t) => t.id === selectedId) ?? null
  const closeNew = () => navigate({ search: {} })

  const moveTo = (id: string, status: TaskStatus) => {
    const t = all.find((x) => x.id === id)
    if (t && t.status !== status) updateTask(id, { status }, `Moved to ${status}`)
  }

  return (
    <div>
      <PageHeader
        title="Staff Tasks"
        description={own ? 'Your assigned tasks. Drag a card to update its progress.' : 'Create, assign and track daily work across reception, cleaning and maintenance.'}
        actions={
          <>
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'board', label: <><KanbanSquare className="h-4 w-4" /> Board</> },
                { value: 'calendar', label: <><CalendarDays className="h-4 w-4" /> Calendar</> },
              ]}
            />
            {canAssignTasks(user.role) && (
              <button className="btn-primary" onClick={() => navigate({ search: { new: true } })}>
                <Plus className="h-4 w-4" /> New task
              </button>
            )}
          </>
        }
      />

      <div className="card mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {!own && (
            <select className="input w-auto" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
              <option value="all">All staff</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="input w-auto" value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} aria-label="Priority">
            <option value="all">All priorities</option>
            {priorities.map((p) => <option key={p}>{p}</option>)}
          </select>
          <button
            onClick={() => setOverdueOnly((o) => !o)}
            className={cx('btn border', overdueOnly ? 'border-red-300 bg-red-50 text-red-700' : 'border-line bg-white text-ink-soft hover:bg-canvas')}
          >
            <Clock className="h-4 w-4" /> Overdue <span className="rounded-full bg-red-600 px-1.5 text-[11px] text-white">{overdueCount}</span>
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 scroll-thin sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          {columns.map((col) => {
            const items = tasks
              .filter((t) => t.status === col.status)
              .sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : priorities.indexOf(a.priority) - priorities.indexOf(b.priority)))
            return (
              <section
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDropTarget(col.status)
                }}
                onDragLeave={() => setDropTarget((d) => (d === col.status ? null : d))}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragId) moveTo(dragId, col.status)
                  setDragId(null)
                  setDropTarget(null)
                }}
                className={cx(
                  'flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-2xl border bg-canvas/80 p-3 transition sm:w-80 lg:w-auto lg:max-w-none',
                  dropTarget === col.status ? 'border-brand-400 bg-brand-50' : 'border-line',
                )}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-sm font-bold">{col.status}</h2>
                    <p className="text-[11px] text-ink-muted">{col.hint}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-ink-soft ring-1 ring-line">{items.length}</span>
                </header>
                <div className="flex min-h-24 flex-1 flex-col gap-2.5">
                  {items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      dragging={dragId === t.id}
                      onOpen={() => setSelectedId(t.id)}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setDropTarget(null)
                      }}
                    />
                  ))}
                  {items.length === 0 && <p className="rounded-xl border-2 border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">Drop tasks here</p>}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <TaskCalendar tasks={tasks} onOpen={setSelectedId} />
      )}

      <NewTaskModal open={!!openNew} onClose={closeNew} />
      {selected && <TaskDetail task={selected} onClose={() => setSelectedId(null)} canAssign={canAssignTasks(user.role)} />}
    </div>
  )
}

function TaskCard({ task: t, dragging, onOpen, onDragStart, onDragEnd }: { task: StaffTask; dragging: boolean; onOpen: () => void; onDragStart: () => void; onDragEnd: () => void }) {
  const overdue = isOverdue(t.dueDate, t.status === 'Done')
  const person = staffById(t.assigneeId)
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cx(
        'group relative cursor-grab overflow-hidden rounded-xl border bg-white p-3 pl-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing',
        overdue ? 'border-red-200' : 'border-line',
        dragging && 'opacity-40',
      )}
    >
      <span className={cx('absolute inset-y-0 left-0 w-1', priorityBar[t.priority])} />
      <div className="flex items-start justify-between gap-2">
        <p className={cx('text-sm font-semibold leading-snug', t.status === 'Done' && 'text-ink-muted line-through decoration-1')}>{t.title}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge tone={priorityTone[t.priority]}>{t.priority}</Badge>
        <Badge>{t.category}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Avatar person={person} size="sm" />
          {person?.name.split(' ')[0]}
        </span>
        <span className={cx('flex items-center gap-1 text-xs font-semibold', overdue ? 'text-red-600' : 'text-ink-muted')}>
          {overdue && <Clock className="h-3 w-3" />}
          {t.status === 'Done' ? formatDate(t.dueDate) : relativeDay(t.dueDate)}
        </span>
      </div>
    </article>
  )
}

function TaskCalendar({ tasks, onOpen }: { tasks: StaffTask[]; onOpen: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = today().split('-').map(Number)
    return { y, m: m - 1 }
  })
  const first = new Date(cursor.y, cursor.m, 1)
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const lead = (first.getDay() + 6) % 7 // Monday-first weeks
  const cells = Array.from({ length: Math.ceil((lead + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - lead + 1
    if (day < 1 || day > daysInMonth) return null
    return `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  })
  const t = today()
  const shift = (n: number) => setCursor((c) => {
    const d = new Date(c.y, c.m + n, 1)
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-base font-bold">{first.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1">
          <button className="btn-ghost px-2" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
          <button className="btn-ghost" onClick={() => { const [y, m] = t.split('-').map(Number); setCursor({ y, m: m - 1 }) }}>Today</button>
          <button className="btn-ghost px-2" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-line bg-canvas text-center text-[11px] font-bold uppercase tracking-wider text-ink-muted">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          const dayTasks = date ? tasks.filter((x) => x.dueDate === date) : []
          return (
            <div key={i} className={cx('min-h-20 border-b border-r border-line p-1 sm:min-h-28 sm:p-1.5', !date && 'bg-canvas/60', (i + 1) % 7 === 0 && 'border-r-0')}>
              {date && (
                <>
                  <span className={cx('mb-1 inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold', date === t ? 'bg-brand-500 text-white' : 'text-ink-soft')}>
                    {Number(date.slice(8))}
                  </span>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((x) => {
                      const overdue = isOverdue(x.dueDate, x.status === 'Done')
                      return (
                        <button
                          key={x.id}
                          onClick={() => onOpen(x.id)}
                          title={x.title}
                          className={cx(
                            'flex w-full items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold',
                            x.status === 'Done' ? 'bg-slate-100 text-ink-muted line-through' : overdue ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800',
                          )}
                        >
                          <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', priorityBar[x.priority])} />
                          <span className="hidden truncate sm:inline">{x.title}</span>
                        </button>
                      )
                    })}
                    {dayTasks.length > 3 && <p className="px-1 text-[10px] font-semibold text-ink-muted">+{dayTasks.length - 3} more</p>}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type TaskForm = { title: string; description: string; category: string; assigneeId: string; priority: Priority | ''; dueDate: string }
const emptyTask = (): TaskForm => ({ title: '', description: '', category: '', assigneeId: '', priority: '', dueDate: '' })

function validateTask(f: TaskForm, existing: StaffTask[]) {
  const e: Partial<Record<keyof TaskForm, string>> = {}
  if (f.title.trim().length < 5) e.title = 'Give the task a clear title (at least 5 characters).'
  else if (existing.some((t) => t.status !== 'Done' && t.title.trim().toLowerCase() === f.title.trim().toLowerCase()))
    e.title = 'An open task with this title already exists.'
  if (!f.category) e.category = 'Choose a category.'
  if (!f.assigneeId) e.assigneeId = 'Assign the task to a staff member.'
  if (!f.priority) e.priority = 'Choose a priority.'
  if (!f.dueDate) e.dueDate = 'Set a deadline.'
  else if (f.dueDate < today()) e.dueDate = 'The deadline can’t be in the past.'
  return e
}

function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<TaskForm>(emptyTask)
  const [errors, setErrors] = useState<ReturnType<typeof validateTask>>({})
  const [submitted, setSubmitted] = useState(false)
  const existing = usePortal((s) => s.tasks)

  const set = <K extends keyof TaskForm>(k: K, v: TaskForm[K]) => {
    const next = { ...form, [k]: v }
    setForm(next)
    if (submitted) setErrors(validateTask(next, existing))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validateTask(form, existing)
    setErrors(errs)
    if (Object.keys(errs).length) return
    addTask({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      assigneeId: form.assigneeId,
      priority: form.priority as Priority,
      dueDate: form.dueDate,
    })
    setForm(emptyTask())
    setSubmitted(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New staff task">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Task" error={errors.title}>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Restock level 5 cleaning cupboard" />
        </Field>
        <Field label="Details" hint="Optional — anything the assignee needs to know.">
          <textarea className="input min-h-20" value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assign to" error={errors.assigneeId}>
            <select className="input" value={form.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
              <option value="">Select staff…</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.title}</option>)}
            </select>
          </Field>
          <Field label="Category" error={errors.category}>
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select…</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Priority" error={errors.priority}>
            <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)}>
              <option value="">Select…</option>
              {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Deadline" error={errors.dueDate}>
            <input type="date" min={today()} className="input" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create & assign</button>
        </div>
      </form>
    </Modal>
  )
}

function TaskDetail({ task: t, onClose, canAssign }: { task: StaffTask; onClose: () => void; canAssign: boolean }) {
  const overdue = isOverdue(t.dueDate, t.status === 'Done')
  return (
    <Modal open onClose={onClose} title={t.id}>
      <div className="space-y-5">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <PriorityBadge priority={t.priority} />
            <StatusBadge status={t.status} />
            <Badge>{t.category}</Badge>
            {overdue && <Badge tone="red">Overdue</Badge>}
          </div>
          <h3 className="text-lg font-bold">{t.title}</h3>
          {t.description && <p className="mt-1.5 text-sm text-ink-soft">{t.description}</p>}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Status</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {columns.map(({ status }) => (
              <button
                key={status}
                onClick={() => status !== t.status && updateTask(t.id, { status }, `Moved to ${status}`)}
                className={cx(
                  'rounded-xl border px-2 py-2 text-sm font-semibold transition',
                  t.status === status ? 'border-brand-500 bg-brand-500 text-white' : 'border-line text-ink-soft hover:border-brand-300 hover:bg-brand-50',
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Assigned to">
            <select
              className="input"
              disabled={!canAssign}
              value={t.assigneeId}
              onChange={(e) => updateTask(t.id, { assigneeId: e.target.value }, `Reassigned to ${staffById(e.target.value)?.name}`)}
            >
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="input" disabled={!canAssign} value={t.priority} onChange={(e) => updateTask(t.id, { priority: e.target.value as Priority }, `Priority set to ${e.target.value}`)}>
              {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              className={cx('input', overdue && 'border-red-300 text-red-700')}
              disabled={!canAssign}
              value={t.dueDate}
              onChange={(e) => e.target.value && updateTask(t.id, { dueDate: e.target.value }, `Deadline changed to ${formatDate(e.target.value)}`)}
            />
          </Field>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-muted">History</p>
          <ol className="relative space-y-3 border-l border-line pl-4">
            {[...t.history].reverse().map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
                <p className="text-sm">{h.text}</p>
                <p className="text-xs text-ink-muted" suppressHydrationWarning>{staffById(h.by)?.name} · {timeAgo(h.at)}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  )
}
