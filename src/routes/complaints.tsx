import { createFileRoute } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { complaints, type Complaint } from '@/data/fixtures'
import { staffById, useCurrentUser } from '@/data/store'
import { canViewSensitive } from '@/lib/permissions'
import { formatDate } from '@/lib/format'
import { Badge, StatusBadge } from '@/components/ui'
import { MiniStats, ModulePreview } from '@/components/ModulePreview'

export const Route = createFileRoute('/complaints')({
  head: () => ({ meta: [{ title: 'Complaints · Yugo Ops' }] }),
  component: Complaints,
})

function Complaints() {
  const user = useCurrentUser()
  const sensitiveOk = canViewSensitive(user.role)
  return (
    <ModulePreview<Complaint>
      title="Complaints & Incidents"
      description="Resident complaints and incidents, case owners and follow-up dates."
      rows={complaints}
      summary={
        <MiniStats
          items={[
            { label: 'Open cases', value: complaints.filter((c) => c.status !== 'Resolved').length },
            { label: 'Investigating', value: complaints.filter((c) => c.status === 'Investigating').length },
            { label: 'Awaiting follow-up', value: complaints.filter((c) => c.status === 'Awaiting follow-up').length, tone: 'amber' },
            { label: 'Resolved (30 days)', value: complaints.filter((c) => c.status === 'Resolved').length },
          ]}
        />
      }
      searchText={(c) => `${c.id} ${c.room} ${c.category} ${c.sensitive && !sensitiveOk ? '' : c.summary}`}
      filters={[
        { label: 'Categories', options: ['Noise', 'Cleanliness', 'Safety', 'Facilities', 'Neighbour dispute'], value: (c) => c.category },
        { label: 'Statuses', options: ['Open', 'Investigating', 'Awaiting follow-up', 'Resolved'], value: (c) => c.status },
      ]}
      columns={[
        { header: 'Case', cell: (c) => <span className="font-semibold">{c.id}</span> },
        { header: 'Category', cell: (c) => <Badge tone={c.category === 'Safety' ? 'red' : 'slate'}>{c.category}</Badge> },
        { header: 'Location', cell: (c) => c.room },
        {
          header: 'Summary',
          cell: (c) =>
            c.sensitive && !sensitiveOk ? (
              <span className="inline-flex items-center gap-1.5 text-ink-muted"><Lock className="h-3.5 w-3.5" /> Restricted — manager access only</span>
            ) : (
              <span className="text-ink-soft">{c.summary}</span>
            ),
        },
        { header: 'Owner', cell: (c) => <span className="whitespace-nowrap">{staffById(c.assigneeId)?.name}</span> },
        { header: 'Follow-up', cell: (c) => formatDate(c.followUp) },
        { header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
      ]}
      upcoming={[
        'Log new complaints and incidents with validation',
        'Chronological case history, actions taken and resolution notes',
        'Internal notes visible only to authorised staff',
        'Sensitive cases protected on the server, not just hidden in the browser',
      ]}
    />
  )
}
