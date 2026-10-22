import { createFileRoute } from '@tanstack/react-router'
import { Bar } from 'react-chartjs-2'
import { Download } from 'lucide-react'
import { complaints, inspections, maintenanceCategories } from '@/data/fixtures'
import { staffById, usePortal } from '@/data/store'
import { downloadCsv } from '@/lib/csv'
import { PageHeader } from '@/components/ui'
import { ClientOnly, gridColor, series } from '@/components/charts'

export const Route = createFileRoute('/reports')({
  head: () => ({ meta: [{ title: 'Reports · Yugo Ops' }] }),
  component: Reports,
})

function Reports() {
  const maintenance = usePortal((s) => s.maintenance)
  const tasks = usePortal((s) => s.tasks)

  const completed = maintenance.filter((m) => m.status === 'Completed')
  const completionRate = Math.round((completed.length / Math.max(maintenance.length, 1)) * 100)
  const avgDays =
    completed.reduce((sum, m) => sum + (Date.parse(m.completedAt ?? m.dueDate) - Date.parse(m.createdAt)) / 86_400_000, 0) / Math.max(completed.length, 1)
  const inspectionsDone = inspections.filter((i) => i.status !== 'Scheduled').length
  const tasksDone = tasks.filter((t) => t.status === 'Done').length

  const byCategory = maintenanceCategories
    .map((c) => ({
      c,
      open: maintenance.filter((m) => m.category === c && m.status !== 'Completed').length,
      done: maintenance.filter((m) => m.category === c && m.status === 'Completed').length,
    }))
    .filter((r) => r.open + r.done > 0)

  const kpis = [
    { label: 'Maintenance completion rate', value: `${completionRate}%` },
    { label: 'Avg. days to complete', value: avgDays.toFixed(1) },
    { label: 'Inspections completed', value: `${inspectionsDone}/${inspections.length}` },
    { label: 'Tasks completed', value: `${tasksDone}/${tasks.length}` },
    { label: 'Open complaints', value: complaints.filter((c) => c.status !== 'Resolved').length },
  ]

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Operational performance across maintenance, inspections, complaints and staff workload."
        actions={
          <>
            <button
              className="btn-ghost"
              onClick={() =>
                downloadCsv('maintenance-report.csv', maintenance.map((m) => ({
                  ID: m.id, Room: m.room, Category: m.category, Priority: m.priority, Status: m.status,
                  Assignee: staffById(m.assigneeId)?.name ?? 'Unassigned', Created: m.createdAt, Due: m.dueDate, Completed: m.completedAt ?? '',
                })))
              }
            >
              <Download className="h-4 w-4" /> Maintenance CSV
            </button>
            <button
              className="btn-ghost"
              onClick={() =>
                downloadCsv('tasks-report.csv', tasks.map((t) => ({
                  ID: t.id, Task: t.title, Category: t.category, Assignee: staffById(t.assigneeId)?.name ?? '', Priority: t.priority, Status: t.status, Due: t.dueDate,
                })))
              }
            >
              <Download className="h-4 w-4" /> Tasks CSV
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <p className="text-2xl font-extrabold tracking-tight">{k.value}</p>
            <p className="mt-1 text-xs font-semibold text-ink-muted">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 text-base font-bold">Maintenance by category</h2>
          <ClientOnly>
            <div className="h-[280px]">
              <Bar
                data={{
                  labels: byCategory.map((r) => r.c),
                  datasets: [
                    { label: 'Open', data: byCategory.map((r) => r.open), backgroundColor: series.orange, borderRadius: 4, borderSkipped: 'start' },
                    { label: 'Completed', data: byCategory.map((r) => r.done), backgroundColor: series.teal, borderRadius: 4, borderSkipped: 'start' },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: { legend: { position: 'top', align: 'end' } },
                  scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: gridColor }, border: { display: false }, ticks: { precision: 0 } } },
                }}
              />
            </div>
          </ClientOnly>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-base font-bold">Coming next to reports</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li>• Filters by date range, category and staff member across every report</li>
            <li>• Complaint resolution times and inspection pass rates over time</li>
            <li>• Excel (.xlsx) exports alongside CSV</li>
            <li>• Scheduled weekly summaries for managers</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
