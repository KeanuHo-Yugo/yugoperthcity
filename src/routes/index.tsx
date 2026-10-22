import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  RefreshCw,
  ClipboardCheck,
  KanbanSquare,
  LogIn,
  LogOut,
  MessageSquareWarning,
  Plus,
  Wrench,
} from 'lucide-react'
import { complaints, inspections, maintenanceTrend, movements, today, transfers } from '@/data/fixtures'
import { staffById, useCurrentUser, usePortal } from '@/data/store'
import { canAccess, canViewSensitive, seesOnlyOwnWork, type ModuleKey } from '@/lib/permissions'
import { formatDate, isOverdue, relativeDay, timeAgo } from '@/lib/format'
import { Avatar, PriorityBadge, StatusBadge, cx } from '@/components/ui'
import { ClientOnly, gridColor, series } from '@/components/charts'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Dashboard() {
  const user = useCurrentUser()
  const maintenance = usePortal((s) => s.maintenance)
  const tasks = usePortal((s) => s.tasks)
  const activities = usePortal((s) => s.activities)
  const own = seesOnlyOwnWork(user.role)

  // Time-of-day text differs between server and browser, so render it after hydration.
  const [now, setNow] = useState<{ greet: string; date: string } | null>(null)
  useEffect(() => {
    setNow({
      greet: greeting(),
      date: new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    })
  }, [])

  const t = today()
  const myMaintenance = own ? maintenance.filter((m) => m.assigneeId === user.id) : maintenance
  const myTasks = own ? tasks.filter((x) => x.assigneeId === user.id) : tasks
  const openMaintenance = myMaintenance.filter((m) => m.status !== 'Completed')
  const openTasks = myTasks.filter((x) => x.status !== 'Done')

  const stats: { label: string; value: number; sub: string; icon: typeof Wrench; to: '/check-ins' | '/maintenance' | '/complaints' | '/inspections' | '/tasks' | '/transfers'; module: ModuleKey; alert?: boolean }[] = [
    {
      label: 'Check-ins today',
      value: movements.filter((m) => m.type === 'Check-in' && m.date === t).length,
      sub: `${movements.filter((m) => m.type === 'Check-in' && m.date === t && m.status === 'Completed').length} arrived so far`,
      icon: LogIn, to: '/check-ins', module: 'checkins',
    },
    {
      label: 'Check-outs today',
      value: movements.filter((m) => m.type === 'Check-out' && m.date === t).length,
      sub: `${movements.filter((m) => m.type === 'Check-out' && m.status === 'Overdue').length} overdue from yesterday`,
      icon: LogOut, to: '/check-ins', module: 'checkins',
      alert: movements.some((m) => m.status === 'Overdue'),
    },
    {
      label: own ? 'My maintenance jobs' : 'Open maintenance',
      value: openMaintenance.length,
      sub: `${openMaintenance.filter((m) => m.priority === 'Urgent').length} urgent · ${openMaintenance.filter((m) => isOverdue(m.dueDate, false)).length} overdue`,
      icon: Wrench, to: '/maintenance', module: 'maintenance',
      alert: openMaintenance.some((m) => m.priority === 'Urgent'),
    },
    {
      label: 'Resident complaints',
      value: complaints.filter((c) => c.status !== 'Resolved').length,
      sub: `${complaints.filter((c) => c.status !== 'Resolved' && c.followUp <= t).length} follow-ups due`,
      icon: MessageSquareWarning, to: '/complaints', module: 'complaints',
    },
    {
      label: 'Pending inspections',
      value: inspections.filter((i) => i.status === 'Scheduled' || i.status === 'Re-inspection Required').length,
      sub: `${inspections.filter((i) => i.status === 'Scheduled' && i.scheduled === t).length} scheduled today`,
      icon: ClipboardCheck, to: '/inspections', module: 'inspections',
    },
    {
      label: own ? 'My open tasks' : 'Outstanding tasks',
      value: openTasks.length,
      sub: `${openTasks.filter((x) => isOverdue(x.dueDate, false)).length} overdue`,
      icon: KanbanSquare, to: '/tasks', module: 'tasks',
      alert: openTasks.some((x) => isOverdue(x.dueDate, false)),
    },
    {
      label: 'Upcoming transfers',
      value: transfers.filter((x) => x.approval !== 'Declined' && x.moveDate >= t).length,
      sub: `${transfers.filter((x) => x.approval === 'Requested').length} awaiting approval`,
      icon: ArrowLeftRight, to: '/transfers', module: 'transfers',
    },
  ]
  const visibleStats = stats.filter((s) => canAccess(user.role, s.module))

  const urgent = useMemo(
    () =>
      [
        ...openMaintenance
          .filter((m) => m.priority === 'Urgent' || m.priority === 'High' || isOverdue(m.dueDate, false))
          .map((m) => ({ id: m.id, title: m.title, where: m.room, priority: m.priority, due: m.dueDate, to: '/maintenance' as const, kind: 'Maintenance' })),
        ...openTasks
          .filter((x) => x.priority === 'Urgent' || isOverdue(x.dueDate, false))
          .map((x) => ({ id: x.id, title: x.title, where: staffById(x.assigneeId)?.name ?? '', priority: x.priority, due: x.dueDate, to: '/tasks' as const, kind: 'Task' })),
      ]
        .sort((a, b) => (a.due < b.due ? -1 : 1))
        .slice(0, 6),
    [openMaintenance, openTasks],
  )

  const quickActions = [
    { label: 'Log maintenance', icon: Wrench, to: '/maintenance' as const, module: 'maintenance' as const },
    { label: 'Assign a task', icon: KanbanSquare, to: '/tasks' as const, module: 'tasks' as const },
    { label: 'Record a complaint', icon: MessageSquareWarning, to: '/complaints' as const, module: 'complaints' as const },
    { label: 'Schedule inspection', icon: ClipboardCheck, to: '/inspections' as const, module: 'inspections' as const },
  ].filter((a) => canAccess(user.role, a.module))

  const todaysMovements = movements.filter((m) => m.date === t || m.status === 'Overdue')

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 px-6 py-7 text-white sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-white/10" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/80" suppressHydrationWarning>{now?.date ?? ' '}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {now?.greet ?? 'Welcome'}, {user.name.split(' ')[0]}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/85">
              {own
                ? `You have ${openMaintenance.length + openTasks.length} open items assigned to you today.`
                : `Here’s what’s happening across Yugo Perth City today.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => window.location.reload()}
    className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 transition hover:bg-white/90"
    title="Reload dashboard"
  >
    <RefreshCw className="h-4 w-4" />
    Refresh Dashboard
  </button>
  {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                search={a.module === 'maintenance' || a.module === 'tasks' ? { new: true } : undefined}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur transition hover:bg-white hover:text-brand-700"
              >
                <Plus className="h-4 w-4" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {visibleStats.map((s) => (
          <Link key={s.label} to={s.to} className="card group p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md sm:p-5">
            <div className="flex items-start justify-between">
              <span className={cx('grid h-9 w-9 place-items-center rounded-xl', s.alert ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600')}>
                <s.icon className="h-[18px] w-[18px]" />
              </span>
              <ArrowRight className="h-4 w-4 text-ink-muted opacity-0 transition group-hover:opacity-100" />
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight">{s.value}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink">{s.label}</p>
            <p className={cx('mt-1 text-xs', s.alert ? 'font-semibold text-red-600' : 'text-ink-muted')}>{s.sub}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {/* Urgent */}
        <div className="card p-5 xl:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Urgent & overdue
            </h2>
            <span className="text-xs font-semibold text-ink-muted">{urgent.length} items</span>
          </div>
          {urgent.length === 0 ? (
            <p className="rounded-xl bg-canvas px-4 py-8 text-center text-sm text-ink-muted">Nothing urgent right now.</p>
          ) : (
            <ul className="space-y-2">
              {urgent.map((u) => {
                const overdue = isOverdue(u.due, false)
                return (
                  <li key={u.id}>
                    <Link to={u.to} className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40">
                      <span className={cx('mt-1 h-2 w-2 shrink-0 rounded-full', u.priority === 'Urgent' || overdue ? 'bg-red-600' : 'bg-orange-500')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{u.title}</span>
                        <span className="text-xs text-ink-muted">
                          {u.kind} · {u.id} · {u.where}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <PriorityBadge priority={u.priority} />
                        <span className={cx('text-[11px] font-semibold', overdue ? 'text-red-600' : 'text-ink-muted')}>
                          {overdue ? `Due ${relativeDay(u.due).toLowerCase()}` : relativeDay(u.due)}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Charts */}
        <div className="card p-5 xl:col-span-2">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold">Maintenance throughput</h2>
            <span className="text-xs text-ink-muted">Requests opened vs completed per week · demo history</span>
          </div>
          <ClientOnly>
            <div className="h-[260px]">
              <Bar
                data={{
                  labels: maintenanceTrend.map((w) => formatDate(w.weekOf)),
                  datasets: [
                    { label: 'Opened', data: maintenanceTrend.map((w) => w.opened), backgroundColor: series.teal, borderRadius: 4, borderSkipped: 'start', barPercentage: 0.7, categoryPercentage: 0.7 },
                    { label: 'Completed', data: maintenanceTrend.map((w) => w.completed), backgroundColor: series.violet, borderRadius: 4, borderSkipped: 'start', barPercentage: 0.7, categoryPercentage: 0.7 },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { title: (i) => `Week of ${i[0].label}` } } },
                  scales: {
                    x: { grid: { display: false }, border: { display: false } },
                    y: { beginAtZero: true, grid: { color: gridColor }, border: { display: false }, ticks: { precision: 0 } },
                  },
                }}
              />
            </div>
          </ClientOnly>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <WorkloadChart />

        {/* Today's arrivals and departures */}
        {canAccess(user.role, 'checkins') ? (
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">Today’s arrivals & departures</h2>
              <Link to="/check-ins" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
            </div>
            <ul className="divide-y divide-line">
              {todaysMovements.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-2.5">
                  <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg', m.type === 'Check-in' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-600')}>
                    {m.type === 'Check-in' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{m.resident}</span>
                    <span className="text-xs text-ink-muted">Room {m.room} · {m.status === 'Overdue' ? relativeDay(m.date) : m.time}</span>
                  </span>
                  <StatusBadge status={m.documents !== 'Complete' && m.documents !== 'Not required' && m.status !== 'Completed' ? m.documents : m.status} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card p-5">
            <h2 className="mb-4 text-base font-bold">My week</h2>
            <ul className="space-y-2">
              {[...openTasks, ...openMaintenance.map((m) => ({ ...m, title: `${m.title} (${m.room})` }))]
                .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
                .slice(0, 6)
                .map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas px-3 py-2">
                    <span className="truncate text-sm font-semibold">{x.title}</span>
                    <span className={cx('shrink-0 text-xs font-semibold', isOverdue(x.dueDate, false) ? 'text-red-600' : 'text-ink-muted')}>{relativeDay(x.dueDate)}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Recent activity */}
        <div className="card p-5">
          <h2 className="mb-4 text-base font-bold">Recent activity</h2>
          <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-4 before:top-2 before:w-px before:bg-line">
            {[...activities]
              .filter((a) => canViewSensitive(user.role) || a.module !== 'Complaints')
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .slice(0, 6)
              .map((a) => {
                const by = staffById(a.byId)
                return (
                  <li key={a.id} className="relative flex gap-3">
                    <Avatar person={by} />
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{by?.name}</span> <span className="text-ink-soft">{a.text}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted" suppressHydrationWarning>
                        {a.module} · {timeAgo(a.at)}
                      </p>
                    </div>
                  </li>
                )
              })}
          </ol>
        </div>
      </section>
    </div>
  )
}

function WorkloadChart() {
  const maintenance = usePortal((s) => s.maintenance)
  const tasks = usePortal((s) => s.tasks)

  const rows = useMemo(() => {
    const ids = [...new Set([...tasks.map((t) => t.assigneeId), ...maintenance.map((m) => m.assigneeId).filter(Boolean)])] as string[]
    return ids
      .map((id) => ({
        name: staffById(id)?.name ?? id,
        tasks: tasks.filter((t) => t.assigneeId === id && t.status !== 'Done').length,
        maintenance: maintenance.filter((m) => m.assigneeId === id && m.status !== 'Completed').length,
      }))
      .filter((r) => r.tasks + r.maintenance > 0)
      .sort((a, b) => b.tasks + b.maintenance - (a.tasks + a.maintenance))
  }, [maintenance, tasks])

  return (
    <div className="card p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-base font-bold">Open workload by staff</h2>
        <span className="text-xs text-ink-muted">Live</span>
      </div>
      <ClientOnly fallbackHeight={280}>
        <div className="h-[280px]">
          <Bar
            data={{
              labels: rows.map((r) => r.name.split(' ')[0]),
              datasets: [
                { label: 'Tasks', data: rows.map((r) => r.tasks), backgroundColor: series.teal, borderRadius: 4, borderColor: '#fff', borderWidth: { right: 2 }, borderSkipped: false },
                { label: 'Maintenance', data: rows.map((r) => r.maintenance), backgroundColor: series.orange, borderRadius: 4, borderSkipped: false },
              ],
            }}
            options={{
              indexAxis: 'y',
              maintainAspectRatio: false,
              interaction: { mode: 'index', intersect: false },
              plugins: { legend: { position: 'top', align: 'end' }, tooltip: { callbacks: { title: (i) => rows[i[0].dataIndex]?.name ?? '' } } },
              scales: {
                x: { stacked: true, beginAtZero: true, grid: { color: gridColor }, border: { display: false }, ticks: { precision: 0 } },
                y: { stacked: true, grid: { display: false }, border: { display: false } },
              },
            }}
          />
        </div>
      </ClientOnly>
    </div>
  )
}
