import { createFileRoute } from '@tanstack/react-router'
import { movements, today, type Movement } from '@/data/fixtures'
import { staffById } from '@/data/store'
import { formatDate } from '@/lib/format'
import { Badge, StatusBadge } from '@/components/ui'
import { MiniStats, ModulePreview } from '@/components/ModulePreview'

export const Route = createFileRoute('/check-ins')({
  head: () => ({ meta: [{ title: 'Check-ins & Outs · Yugo Ops' }] }),
  component: CheckIns,
})

function CheckIns() {
  const t = today()
  return (
    <ModulePreview<Movement>
      title="Check-ins & Outs"
      description="Resident arrivals and departures, documentation status and assigned reception staff."
      rows={movements}
      summary={
        <MiniStats
          items={[
            { label: 'Arrivals today', value: movements.filter((m) => m.type === 'Check-in' && m.date === t).length },
            { label: 'Departures today', value: movements.filter((m) => m.type === 'Check-out' && m.date === t).length },
            { label: 'Missing documents', value: movements.filter((m) => m.documents === 'Missing ID' || m.documents === 'Awaiting contract').length, tone: 'amber' },
            { label: 'Overdue', value: movements.filter((m) => m.status === 'Overdue').length, tone: 'red' },
          ]}
        />
      }
      searchText={(m) => `${m.id} ${m.resident} ${m.room}`}
      filters={[
        { label: 'Types', options: ['Check-in', 'Check-out'], value: (m) => m.type },
        { label: 'Statuses', options: ['Expected', 'Completed', 'Overdue'], value: (m) => m.status },
      ]}
      columns={[
        { header: 'Resident', cell: (m) => <><p className="font-semibold">{m.resident}</p><p className="text-xs text-ink-muted">{m.id}</p></> },
        { header: 'Type', cell: (m) => <Badge tone={m.type === 'Check-in' ? 'teal' : 'slate'}>{m.type}</Badge> },
        { header: 'Room', cell: (m) => <span className="font-semibold">{m.room}</span> },
        { header: 'Scheduled', cell: (m) => <span className="whitespace-nowrap">{formatDate(m.date)} · {m.time}</span> },
        { header: 'Documents', cell: (m) => <StatusBadge status={m.documents} /> },
        { header: 'Status', cell: (m) => <StatusBadge status={m.status} /> },
        { header: 'Staff', cell: (m) => <span className="whitespace-nowrap">{staffById(m.staffId)?.name}</span> },
      ]}
      upcoming={[
        'Step-by-step check-in and check-out checklists',
        'Mark arrivals complete and capture key / fob numbers',
        'Upcoming-arrivals timeline with overdue highlighting',
        'Import booking lists from Excel or CSV',
      ]}
    />
  )
}
