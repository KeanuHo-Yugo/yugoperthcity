import { createFileRoute } from '@tanstack/react-router'
import { inspections, type Inspection } from '@/data/fixtures'
import { staffById } from '@/data/store'
import { formatDate } from '@/lib/format'
import { Badge, StatusBadge } from '@/components/ui'
import { MiniStats, ModulePreview } from '@/components/ModulePreview'

export const Route = createFileRoute('/inspections')({
  head: () => ({ meta: [{ title: 'Inspections · Yugo Ops' }] }),
  component: Inspections,
})

function Inspections() {
  const count = (s: Inspection['status']) => inspections.filter((i) => i.status === s).length
  return (
    <ModulePreview<Inspection>
      title="Room Inspections"
      description="Scheduled room and common-area inspections, outcomes and follow-ups."
      rows={inspections}
      summary={
        <MiniStats
          items={[
            { label: 'Scheduled', value: count('Scheduled') },
            { label: 'Passed', value: count('Passed') },
            { label: 'Failed', value: count('Failed'), tone: 'red' },
            { label: 'Re-inspection required', value: count('Re-inspection Required'), tone: 'amber' },
          ]}
        />
      }
      searchText={(i) => `${i.id} ${i.area} ${i.notes}`}
      filters={[
        { label: 'Areas', options: ['Room', 'Common area'], value: (i) => i.type },
        { label: 'Outcomes', options: ['Scheduled', 'Passed', 'Failed', 'Re-inspection Required'], value: (i) => i.status },
      ]}
      columns={[
        { header: 'Area', cell: (i) => <><p className="font-semibold">{i.area}</p><p className="text-xs text-ink-muted">{i.id}</p></> },
        { header: 'Type', cell: (i) => <Badge>{i.type}</Badge> },
        { header: 'Scheduled', cell: (i) => formatDate(i.scheduled) },
        { header: 'Inspector', cell: (i) => staffById(i.inspectorId)?.name },
        { header: 'Outcome', cell: (i) => <StatusBadge status={i.status} /> },
        { header: 'Notes', cell: (i) => <span className="text-ink-soft">{i.notes}</span> },
      ]}
      upcoming={[
        'Schedule inspections and assign them to cleaning staff',
        'Mobile inspection checklist with photo capture',
        'Raise follow-up maintenance requests straight from a failed item',
        'Printable inspection summaries per room or period',
      ]}
    />
  )
}
