import { createFileRoute } from '@tanstack/react-router'
import { rooms, type Room } from '@/data/fixtures'
import { formatDate } from '@/lib/format'
import { Badge, cx } from '@/components/ui'
import { ModulePreview } from '@/components/ModulePreview'

export const Route = createFileRoute('/rooms')({
  head: () => ({ meta: [{ title: 'Room Availability · Yugo Ops' }] }),
  component: Rooms,
})

const statusStyle: Record<Room['status'], string> = {
  Occupied: 'bg-brand-500 text-white',
  Available: 'bg-white text-brand-700 ring-1 ring-inset ring-brand-300',
  Reserved: 'bg-violet-100 text-violet-800',
  'Out of order': 'bg-red-100 text-red-700',
}
const tone = { Occupied: 'teal', Available: 'green', Reserved: 'violet', 'Out of order': 'red' } as const

function Rooms() {
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => b - a)
  return (
    <ModulePreview<Room>
      title="Room Availability"
      description="Occupancy and availability across every floor and apartment type."
      rows={rooms}
      summary={
        <div className="card mb-5 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold">Floor map</h2>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-ink-soft">
              {(Object.keys(statusStyle) as Room['status'][]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cx('h-3 w-3 rounded', statusStyle[s])} /> {s} ({rooms.filter((r) => r.status === s).length})
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {floors.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-bold text-ink-muted">Level {f}</span>
                <div className="grid flex-1 grid-cols-5 gap-2">
                  {rooms.filter((r) => r.floor === f).map((r) => (
                    <span key={r.number} title={`${r.number} · ${r.type} · ${r.status}`} className={cx('rounded-lg py-1.5 text-center text-xs font-bold', statusStyle[r.status])}>
                      {r.number}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      searchText={(r) => `${r.number} ${r.type}`}
      filters={[
        { label: 'Types', options: ['Studio', 'Ensuite', '2-Bed Apartment', '4-Bed Apartment', 'Accessible Studio'], value: (r) => r.type },
        { label: 'Floors', options: floors.map(String), value: (r) => String(r.floor) },
        { label: 'Availability', options: ['Occupied', 'Available', 'Reserved', 'Out of order'], value: (r) => r.status },
      ]}
      columns={[
        { header: 'Room', cell: (r) => <span className="font-semibold">{r.number}</span> },
        { header: 'Floor', cell: (r) => r.floor },
        { header: 'Type', cell: (r) => r.type },
        { header: 'Status', cell: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge> },
        { header: 'Booked until', cell: (r) => (r.bookedUntil ? formatDate(r.bookedUntil, { day: 'numeric', month: 'short', year: 'numeric' }) : '—') },
      ]}
      upcoming={[
        'Booking calendar showing each room’s occupancy over time',
        'Import the existing room availability spreadsheet (Excel / CSV) with duplicate detection',
        'Edit room status and booking dates with change history',
      ]}
    />
  )
}
