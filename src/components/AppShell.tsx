import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useRouterState, type LinkProps } from '@tanstack/react-router'
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BedDouble,
  ChevronDown,
  ClipboardCheck,
  KanbanSquare,
  LayoutDashboard,
  LogIn,
  Menu,
  MessageSquareWarning,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Search,
  Wrench,
  X,
} from 'lucide-react'
import { movements, rooms, type Role } from '@/data/fixtures'
import { setRole, staffById, useCurrentUser, usePortal } from '@/data/store'
import { canAccess, roleLabels, seesOnlyOwnWork, type ModuleKey } from '@/lib/permissions'
import { isOverdue } from '@/lib/format'
import { Avatar, cx } from './ui'

type AppPath = NonNullable<LinkProps['to']>
type NavItem = { to: AppPath; label: string; icon: typeof Wrench; module: ModuleKey }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/maintenance', label: 'Maintenance', icon: Wrench, module: 'maintenance' },
      { to: '/tasks', label: 'Staff Tasks', icon: KanbanSquare, module: 'tasks' },
      { to: '/check-ins', label: 'Check-ins & Outs', icon: LogIn, module: 'checkins' },
      { to: '/rooms', label: 'Room Availability', icon: BedDouble, module: 'rooms' },
      { to: '/inspections', label: 'Inspections', icon: ClipboardCheck, module: 'inspections' },
      { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning, module: 'complaints' },
      { to: '/transfers', label: 'Room Transfers', icon: ArrowLeftRight, module: 'transfers' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3, module: 'reports' },
      { to: '/integrations', label: 'Integrations', icon: Plug, module: 'settings' },
    ],
  },
]

function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4l7 8 7-8M12 12v8" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight text-ink">Yugo Ops</span>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand-600">Perth City</span>
        </span>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useCurrentUser()
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  useEffect(() => setMobileOpen(false), [pathname])
  const currentItem = navGroups.flatMap((g) => g.items).find((i) => i.to !== '/' && pathname.startsWith(i.to))

  const sidebar = (isMobile: boolean) => {
    const compact = collapsed && !isMobile
    return (
      <div className="flex h-full flex-col">
        <div className={cx('flex h-16 items-center border-b border-line', compact ? 'justify-center px-2' : 'justify-between px-5')}>
          <Logo compact={compact} />
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5 scroll-thin">
          {navGroups.map((group) => {
            const items = group.items.filter((i) => canAccess(user.role, i.module))
            if (!items.length) return null
            return (
              <div key={group.label}>
                {!compact && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{group.label}</p>}
                <ul className="space-y-1">
                  {items.map((item) => {
                    const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
                    return (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          title={compact ? item.label : undefined}
                          className={cx(
                            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                            compact && 'justify-center px-0',
                            active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas hover:text-ink',
                          )}
                        >
                          <item.icon className={cx('h-[18px] w-[18px] shrink-0', active ? 'text-brand-600' : 'text-ink-muted group-hover:text-ink-soft')} />
                          {!compact && item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>
        {!isMobile && (
          <div className="border-t border-line p-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-canvas hover:text-ink', collapsed && 'justify-center px-0')}
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
              {!collapsed && 'Collapse sidebar'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <aside className={cx('fixed inset-y-0 left-0 z-30 hidden border-r border-line bg-white transition-[width] duration-200 lg:block', collapsed ? 'w-[76px]' : 'w-64')}>
        {sidebar(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar(true)}</aside>
        </div>
      )}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <TopBar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {currentItem && !canAccess(user.role, currentItem.module) ? <NoAccess /> : children}
        </main>
      </div>
    </div>
  )
}

function NoAccess() {
  const user = useCurrentUser()
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <p className="text-lg font-bold">This area isn’t available for {roleLabels[user.role]}</p>
      <p className="mt-2 text-sm text-ink-soft">Ask a manager if you need access. You can switch the previewed role from your profile menu.</p>
      <Link to="/" className="btn-primary mt-5">Back to dashboard</Link>
    </div>
  )
}

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-ink-soft hover:bg-canvas lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  )
}

type SearchHit = { group: string; label: string; meta: string; to: AppPath }

function GlobalSearch() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const user = useCurrentUser()
  const maintenance = usePortal((s) => s.maintenance)
  const tasks = usePortal((s) => s.tasks)
  const ref = useClickOutside(() => setOpen(false))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hits = useMemo<SearchHit[]>(() => {
    const term = q.trim().toLowerCase()
    if (term.length < 2) return []
    const own = seesOnlyOwnWork(user.role)
    const out: SearchHit[] = []
    if (canAccess(user.role, 'maintenance')) {
      maintenance
        .filter((m) => !own || m.assigneeId === user.id)
        .filter((m) => `${m.id} ${m.room} ${m.title} ${m.category}`.toLowerCase().includes(term))
        .slice(0, 4)
        .forEach((m) => out.push({ group: 'Maintenance', label: m.title, meta: `${m.id} · ${m.room}`, to: '/maintenance' }))
    }
    tasks
      .filter((t) => !own || t.assigneeId === user.id)
      .filter((t) => `${t.id} ${t.title} ${t.category}`.toLowerCase().includes(term))
      .slice(0, 4)
      .forEach((t) => out.push({ group: 'Tasks', label: t.title, meta: `${t.id} · ${staffById(t.assigneeId)?.name}`, to: '/tasks' }))
    if (canAccess(user.role, 'rooms')) {
      rooms
        .filter((r) => r.number.includes(term) || r.type.toLowerCase().includes(term))
        .slice(0, 3)
        .forEach((r) => out.push({ group: 'Rooms', label: `Room ${r.number}`, meta: `${r.type} · ${r.status}`, to: '/rooms' }))
    }
    if (canAccess(user.role, 'checkins')) {
      movements
        .filter((m) => `${m.resident} ${m.room}`.toLowerCase().includes(term))
        .slice(0, 3)
        .forEach((m) => out.push({ group: 'Residents', label: m.resident, meta: `${m.type} · Room ${m.room}`, to: '/check-ins' }))
    }
    return out
  }, [q, maintenance, tasks, user])

  const groups = [...new Set(hits.map((h) => h.group))]

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search rooms, requests, tasks…"
        className="h-10 w-full rounded-xl border border-line bg-canvas pl-9 pr-14 text-sm outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted sm:block">Ctrl K</kbd>
      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">No matches for “{q}”</p>
          ) : (
            <div className="max-h-96 overflow-y-auto py-2 scroll-thin">
              {groups.map((g) => (
                <div key={g}>
                  <p className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{g}</p>
                  {hits
                    .filter((h) => h.group === g)
                    .map((h, i) => (
                      <button
                        key={g + i}
                        onClick={() => {
                          setOpen(false)
                          setQ('')
                          navigate({ to: h.to })
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-brand-50"
                      >
                        <span className="truncate text-sm font-semibold">{h.label}</span>
                        <span className="shrink-0 text-xs text-ink-muted">{h.meta}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  const user = useCurrentUser()
  const maintenance = usePortal((s) => s.maintenance)
  const tasks = usePortal((s) => s.tasks)

  const items = useMemo(() => {
    const own = seesOnlyOwnWork(user.role)
    const out: { title: string; meta: string; to: AppPath; tone: 'red' | 'amber' }[] = []
    if (canAccess(user.role, 'maintenance')) {
      maintenance
        .filter((m) => m.status !== 'Completed' && (!own || m.assigneeId === user.id))
        .filter((m) => m.priority === 'Urgent' || isOverdue(m.dueDate, false))
        .forEach((m) =>
          out.push({
            title: m.priority === 'Urgent' ? `Urgent: ${m.title}` : `Overdue: ${m.title}`,
            meta: `${m.id} · Room ${m.room}`,
            to: '/maintenance',
            tone: m.priority === 'Urgent' ? 'red' : 'amber',
          }),
        )
    }
    tasks
      .filter((t) => (!own || t.assigneeId === user.id) && isOverdue(t.dueDate, t.status === 'Done'))
      .forEach((t) => out.push({ title: `Overdue task: ${t.title}`, meta: `${t.id} · ${staffById(t.assigneeId)?.name}`, to: '/tasks', tone: 'amber' }))
    return out
  }, [maintenance, tasks, user])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2.5 text-ink-soft hover:bg-canvas hover:text-ink" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{items.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-bold">Needs attention</p>
            <span className="text-xs text-ink-muted">{items.length} items</span>
          </div>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto scroll-thin">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-muted">You’re all caught up.</li>}
            {items.map((n, i) => (
              <li key={i}>
                <Link to={n.to} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-canvas">
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.tone === 'red' ? 'bg-red-600' : 'bg-amber-500')} />
                  <span>
                    <span className="block text-sm font-semibold leading-snug">{n.title}</span>
                    <span className="text-xs text-ink-muted">{n.meta}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="border-t border-line bg-canvas px-4 py-2.5 text-[11px] text-ink-muted">Teams and Outlook alerts are not connected yet.</p>
        </div>
      )}
    </div>
  )
}

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const ref = useClickOutside(() => setOpen(false))
  const user = useCurrentUser()
  const roles = Object.keys(roleLabels) as Role[]

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2 hover:bg-canvas">
        <Avatar person={user} />
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-bold">{user.name}</span>
          <span className="block text-xs text-ink-muted">{roleLabels[user.role]}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-ink-muted md:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-30 w-72 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b border-line px-4 py-4">
            <Avatar person={user} size="lg" />
            <div>
              <p className="text-sm font-bold">{user.name}</p>
              <p className="text-xs text-ink-muted">{user.title}</p>
            </div>
          </div>
          <div className="px-2 py-2">
            <p className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Preview portal as</p>
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r)
                  setOpen(false)
                }}
                className={cx('flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold', user.role === r ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas')}
              >
                {roleLabels[r]}
                {user.role === r && <span className="text-xs">Active</span>}
              </button>
            ))}
          </div>
          <p className="border-t border-line bg-canvas px-4 py-2.5 text-[11px] leading-relaxed text-ink-muted">
            Role preview for demonstration only. Staff sign-in via Microsoft Entra ID is planned and not yet configured.
          </p>
        </div>
      )}
    </div>
  )
}
