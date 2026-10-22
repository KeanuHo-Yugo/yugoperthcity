import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { transfers, type Transfer } from '@/data/fixtures'
import { formatDate, relativeDay } from '@/lib/format'
import { StatusBadge } from '@/components/ui'
import { ModulePreview } from '@/components/ModulePreview'

export const Route = createFileRoute('/transfers')({
  head: () => ({ meta: [{ title: 'Room Transfers · Yugo Ops' }] }),
  component: Transfers,
})

function Transfers() {
  return (
    <ModulePreview<Transfer>
      title="Room Transfers"
      description="Resident room-move requests, approvals and move dates."
      rows={transfers}
      searchText={(t) => `${t.id} ${t.resident} ${t.fromRoom} ${t.toRoom} ${t.reason}`}
      filters={[{ label: 'Approvals', options: ['Requested', 'Approved', 'Declined'], value: (t) => t.approval }]}
      columns={[
        { header: 'Resident', cell: (t) => <><p className="font-semibold">{t.resident}</p><p className="text-xs text-ink-muted">{t.id}</p></> },
        { header: 'Move', cell: (t) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold">{t.fromRoom} <ArrowRight className="h-3.5 w-3.5 text-brand-500" /> {t.toRoom}</span> },
        { header: 'Reason', cell: (t) => <span className="text-ink-soft">{t.reason}</span> },
        { header: 'Move date', cell: (t) => <span className="whitespace-nowrap">{formatDate(t.moveDate)} · <span className="text-ink-muted">{relativeDay(t.moveDate)}</span></span> },
        { header: 'Approval', cell: (t) => <StatusBadge status={t.approval} /> },
      ]}
      upcoming={[
        'Submit and approve transfer requests',
        'Transfer checklist: key return, inspection of old room, new room ready, records updated',
        'Automatic room availability updates when a move completes',
      ]}
    />
  )
}
