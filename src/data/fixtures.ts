/**
 * DEMO DATA — every resident, room and staff member here is fictional.
 *
 * This module is the single source of sample data for the portal prototype.
 * A later milestone replaces these fixtures with Netlify Database queries
 * behind server-side, role-checked endpoints (see PLAN.md).
 */

export type Role = 'admin' | 'manager' | 'reception' | 'maintenance' | 'cleaning'

export type Staff = {
  id: string
  name: string
  initials: string
  role: Role
  title: string
}

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'
export type MaintenanceStatus = 'Pending' | 'In Progress' | 'Completed'
export type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done'

export type HistoryEntry = {
  at: string // ISO timestamp
  by: string // staff id
  text: string
}

export type MaintenanceRequest = {
  id: string
  room: string
  category: string
  title: string
  description: string
  priority: Priority
  status: MaintenanceStatus
  assigneeId: string | null
  reportedById: string
  createdAt: string // ISO date
  dueDate: string // ISO date
  completedAt?: string
  photos: string[] // file names (uploads land in Netlify Blobs later)
  history: HistoryEntry[]
}

export type StaffTask = {
  id: string
  title: string
  description: string
  category: string
  assigneeId: string
  priority: Priority
  status: TaskStatus
  dueDate: string
  createdAt: string
  history: HistoryEntry[]
}

export type Movement = {
  id: string
  type: 'Check-in' | 'Check-out'
  resident: string
  room: string
  date: string
  time: string
  status: 'Expected' | 'Completed' | 'Overdue'
  documents: 'Complete' | 'Missing ID' | 'Awaiting contract' | 'Not required'
  staffId: string
}

export type Complaint = {
  id: string
  category: 'Noise' | 'Cleanliness' | 'Safety' | 'Facilities' | 'Neighbour dispute'
  room: string
  summary: string
  status: 'Open' | 'Investigating' | 'Awaiting follow-up' | 'Resolved'
  assigneeId: string
  followUp: string
  sensitive: boolean
}

export type Inspection = {
  id: string
  area: string
  type: 'Room' | 'Common area'
  scheduled: string
  inspectorId: string
  status: 'Scheduled' | 'Passed' | 'Failed' | 'Re-inspection Required'
  notes: string
}

export type Transfer = {
  id: string
  resident: string
  fromRoom: string
  toRoom: string
  reason: string
  approval: 'Requested' | 'Approved' | 'Declined'
  moveDate: string
}

export type Room = {
  number: string
  floor: number
  type: 'Studio' | 'Ensuite' | '2-Bed Apartment' | '4-Bed Apartment' | 'Accessible Studio'
  status: 'Occupied' | 'Available' | 'Reserved' | 'Out of order'
  bookedUntil: string | null
}

export type Activity = {
  id: string
  at: string
  byId: string
  text: string
  module: 'Maintenance' | 'Tasks' | 'Check-ins' | 'Complaints' | 'Inspections' | 'Transfers' | 'Rooms'
}

// ---------------------------------------------------------------------------
// Date helpers — fixtures are expressed relative to "today" so the demo
// always looks current.

const DAY = 86_400_000
const PERTH_UTC_OFFSET_HOURS = 8 // Western Australia has no daylight saving

/** Today's date in Perth as UTC-midnight milliseconds — identical on server and browser. */
function perthTodayUtc() {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Perth' })
    .format(new Date())
    .split('-')
    .map(Number)
  return Date.UTC(y, m - 1, d)
}
export function dayOffset(n: number) {
  return new Date(perthTodayUtc() + n * DAY).toISOString().slice(0, 10)
}
function stamp(daysAgo: number, hour: number, min = 0) {
  return new Date(perthTodayUtc() - daysAgo * DAY + (hour - PERTH_UTC_OFFSET_HOURS) * 3_600_000 + min * 60_000).toISOString()
}
export const today = () => dayOffset(0)

// ---------------------------------------------------------------------------

export const staff: Staff[] = [
  { id: 's1', name: 'Priya Nair', initials: 'PN', role: 'reception', title: 'Reception Lead' },
  { id: 's2', name: 'Tom Becker', initials: 'TB', role: 'reception', title: 'Reception Officer' },
  { id: 's3', name: 'Marcus Hale', initials: 'MH', role: 'maintenance', title: 'Maintenance Technician' },
  { id: 's4', name: 'Lena Ortiz', initials: 'LO', role: 'maintenance', title: 'Maintenance Technician' },
  { id: 's5', name: 'Grace Whitfield', initials: 'GW', role: 'cleaning', title: 'Cleaning Supervisor' },
  { id: 's6', name: 'Daniel Okafor', initials: 'DO', role: 'cleaning', title: 'Cleaner' },
  { id: 's7', name: 'Sophie Lam', initials: 'SL', role: 'manager', title: 'Building Manager' },
  { id: 's8', name: 'Alex Reid', initials: 'AR', role: 'admin', title: 'Portal Administrator' },
]

export const maintenanceCategories = [
  'Plumbing',
  'Electrical',
  'Appliances',
  'HVAC',
  'Furniture',
  'Doors & Locks',
  'Internet',
  'General',
]

export const maintenanceRequests: MaintenanceRequest[] = [
  {
    id: 'MR-1048', room: '1204', category: 'Plumbing', title: 'Water leaking under bathroom sink',
    description: 'Resident reports steady drip from the trap under the vanity. Towel placed to catch water; floor is damp.',
    priority: 'Urgent', status: 'Pending', assigneeId: 's3', reportedById: 's1',
    createdAt: dayOffset(0), dueDate: dayOffset(0), photos: ['sink-leak.jpg'],
    history: [{ at: stamp(0, 8, 42), by: 's1', text: 'Request logged at reception' }],
  },
  {
    id: 'MR-1047', room: '0815', category: 'Electrical', title: 'Kitchen power point not working',
    description: 'Double power point next to fridge has no power. Breaker checked by resident, appears fine.',
    priority: 'High', status: 'In Progress', assigneeId: 's4', reportedById: 's2',
    createdAt: dayOffset(-1), dueDate: dayOffset(0), photos: [],
    history: [
      { at: stamp(1, 15, 10), by: 's2', text: 'Request logged at reception' },
      { at: stamp(0, 9, 5), by: 's4', text: 'Status changed to In Progress' },
    ],
  },
  {
    id: 'MR-1046', room: 'L2 Common Room', category: 'HVAC', title: 'Air-con blowing warm air',
    description: 'Split system in level 2 common room is running but not cooling. Filter last cleaned 6 weeks ago.',
    priority: 'Medium', status: 'Pending', assigneeId: null, reportedById: 's5',
    createdAt: dayOffset(-1), dueDate: dayOffset(2), photos: [],
    history: [{ at: stamp(1, 11, 30), by: 's5', text: 'Reported during cleaning round' }],
  },
  {
    id: 'MR-1045', room: '0402', category: 'Doors & Locks', title: 'Entry door card reader intermittent',
    description: 'Card needs 3–4 taps before the door unlocks. Resident locked out twice this week.',
    priority: 'High', status: 'Pending', assigneeId: 's3', reportedById: 's1',
    createdAt: dayOffset(-3), dueDate: dayOffset(-1), photos: [],
    history: [{ at: stamp(3, 17, 50), by: 's1', text: 'Request logged at reception' }],
  },
  {
    id: 'MR-1044', room: '1510', category: 'Appliances', title: 'Oven door hinge broken',
    description: 'Oven door drops open and will not stay closed. Resident advised not to use the oven.',
    priority: 'Medium', status: 'In Progress', assigneeId: 's4', reportedById: 's2',
    createdAt: dayOffset(-4), dueDate: dayOffset(1), photos: ['oven-hinge.jpg'],
    history: [
      { at: stamp(4, 10, 15), by: 's2', text: 'Request logged at reception' },
      { at: stamp(2, 13, 0), by: 's4', text: 'Replacement hinge ordered from supplier' },
    ],
  },
  {
    id: 'MR-1043', room: '0611', category: 'Furniture', title: 'Desk chair gas lift failed',
    description: 'Chair sinks to lowest height when sat on. Swap for spare from storage.',
    priority: 'Low', status: 'Pending', assigneeId: null, reportedById: 's6',
    createdAt: dayOffset(-2), dueDate: dayOffset(5), photos: [],
    history: [{ at: stamp(2, 9, 20), by: 's6', text: 'Reported during room clean' }],
  },
  {
    id: 'MR-1042', room: '0903', category: 'Plumbing', title: 'Shower draining slowly',
    description: 'Water pools around ankles during shower. Likely hair blockage.',
    priority: 'Medium', status: 'Completed', assigneeId: 's3', reportedById: 's1',
    createdAt: dayOffset(-5), dueDate: dayOffset(-3), completedAt: dayOffset(-3), photos: [],
    history: [
      { at: stamp(5, 14, 0), by: 's1', text: 'Request logged at reception' },
      { at: stamp(3, 10, 30), by: 's3', text: 'Drain cleared, tested OK. Marked Completed' },
    ],
  },
  {
    id: 'MR-1041', room: 'Car Park B1', category: 'Electrical', title: 'Two fluorescent tubes out near bay 14',
    description: 'Dark patch near bike storage — safety concern at night.',
    priority: 'High', status: 'Completed', assigneeId: 's4', reportedById: 's7',
    createdAt: dayOffset(-6), dueDate: dayOffset(-5), completedAt: dayOffset(-5), photos: [],
    history: [
      { at: stamp(6, 18, 5), by: 's7', text: 'Reported during evening walkthrough' },
      { at: stamp(5, 9, 40), by: 's4', text: 'Tubes replaced. Marked Completed' },
    ],
  },
  {
    id: 'MR-1040', room: '1102', category: 'Internet', title: 'Wi-Fi drops every few minutes',
    description: 'Resident studying online; connection drops repeatedly in bedroom. Access point may need reset.',
    priority: 'Medium', status: 'In Progress', assigneeId: 's3', reportedById: 's2',
    createdAt: dayOffset(-6), dueDate: dayOffset(-2), photos: [],
    history: [
      { at: stamp(6, 12, 0), by: 's2', text: 'Request logged at reception' },
      { at: stamp(4, 15, 30), by: 's3', text: 'Escalated to network provider, ticket #NP-5521' },
    ],
  },
  {
    id: 'MR-1039', room: '0707', category: 'General', title: 'Mould spots on bathroom ceiling',
    description: 'Small black spots near the exhaust fan. Check fan extraction and treat surface.',
    priority: 'Medium', status: 'Completed', assigneeId: 's4', reportedById: 's5',
    createdAt: dayOffset(-9), dueDate: dayOffset(-6), completedAt: dayOffset(-7), photos: ['mould.jpg'],
    history: [
      { at: stamp(9, 10, 0), by: 's5', text: 'Reported during inspection' },
      { at: stamp(7, 11, 10), by: 's4', text: 'Treated and exhaust fan cleaned. Marked Completed' },
    ],
  },
  {
    id: 'MR-1038', room: '1306', category: 'Appliances', title: 'Fridge freezer icing up',
    description: 'Thick ice forming at back of freezer compartment; door seal may be worn.',
    priority: 'Low', status: 'Completed', assigneeId: 's3', reportedById: 's1',
    createdAt: dayOffset(-11), dueDate: dayOffset(-7), completedAt: dayOffset(-8), photos: [],
    history: [
      { at: stamp(11, 9, 0), by: 's1', text: 'Request logged at reception' },
      { at: stamp(8, 14, 20), by: 's3', text: 'Door seal replaced. Marked Completed' },
    ],
  },
  {
    id: 'MR-1037', room: 'Gym', category: 'General', title: 'Treadmill belt slipping',
    description: 'Treadmill #2 belt slips under load. Out-of-order sign placed.',
    priority: 'Low', status: 'Pending', assigneeId: null, reportedById: 's2',
    createdAt: dayOffset(-8), dueDate: dayOffset(-1), photos: [],
    history: [{ at: stamp(8, 16, 45), by: 's2', text: 'Reported by resident at reception' }],
  },
]

export const staffTasks: StaffTask[] = [
  {
    id: 'TSK-311', title: 'Prepare welcome packs for today’s arrivals', description: 'Keys, wristbands, house rules and Wi-Fi card for 6 arrivals.',
    category: 'Reception', assigneeId: 's1', priority: 'High', status: 'In Progress', dueDate: dayOffset(0), createdAt: dayOffset(-1),
    history: [{ at: stamp(1, 16, 0), by: 's7', text: 'Task created and assigned to Priya Nair' }],
  },
  {
    id: 'TSK-310', title: 'Deep clean vacated rooms 0512 & 0514', description: 'Full turnover clean ahead of Friday check-ins.',
    category: 'Cleaning', assigneeId: 's6', priority: 'High', status: 'To Do', dueDate: dayOffset(1), createdAt: dayOffset(-1),
    history: [{ at: stamp(1, 14, 0), by: 's5', text: 'Task created and assigned to Daniel Okafor' }],
  },
  {
    id: 'TSK-309', title: 'Monthly fire extinguisher check — levels 1–8', description: 'Record tag dates and pressure in the compliance log.',
    category: 'Compliance', assigneeId: 's4', priority: 'Medium', status: 'To Do', dueDate: dayOffset(3), createdAt: dayOffset(-2),
    history: [{ at: stamp(2, 9, 0), by: 's7', text: 'Task created and assigned to Lena Ortiz' }],
  },
  {
    id: 'TSK-308', title: 'Chase outstanding contracts for October arrivals', description: '4 residents still missing signed licence agreements.',
    category: 'Reception', assigneeId: 's2', priority: 'Urgent', status: 'To Do', dueDate: dayOffset(-1), createdAt: dayOffset(-4),
    history: [{ at: stamp(4, 10, 0), by: 's7', text: 'Task created and assigned to Tom Becker' }],
  },
  {
    id: 'TSK-307', title: 'Restock cleaning cupboard on level 3', description: 'Bin liners, microfibre cloths, disinfectant.',
    category: 'Cleaning', assigneeId: 's5', priority: 'Low', status: 'Done', dueDate: dayOffset(-2), createdAt: dayOffset(-5),
    history: [
      { at: stamp(5, 11, 0), by: 's5', text: 'Task created' },
      { at: stamp(2, 15, 20), by: 's5', text: 'Moved to Done' },
    ],
  },
  {
    id: 'TSK-306', title: 'Review weekly maintenance backlog', description: 'Prioritise overdue jobs and confirm contractor bookings.',
    category: 'Management', assigneeId: 's7', priority: 'Medium', status: 'Review', dueDate: dayOffset(0), createdAt: dayOffset(-3),
    history: [{ at: stamp(3, 8, 30), by: 's7', text: 'Task created' }],
  },
  {
    id: 'TSK-305', title: 'Replace lobby noticeboard posters', description: 'Swap September events for October calendar and quiet-hours reminder.',
    category: 'Reception', assigneeId: 's1', priority: 'Low', status: 'To Do', dueDate: dayOffset(4), createdAt: dayOffset(-2),
    history: [{ at: stamp(2, 13, 0), by: 's1', text: 'Task created' }],
  },
  {
    id: 'TSK-304', title: 'Test emergency lighting — stairwells A & B', description: '90-minute discharge test. Log any failed fittings as maintenance requests.',
    category: 'Compliance', assigneeId: 's3', priority: 'High', status: 'In Progress', dueDate: dayOffset(1), createdAt: dayOffset(-3),
    history: [{ at: stamp(3, 9, 0), by: 's7', text: 'Task created and assigned to Marcus Hale' }],
  },
  {
    id: 'TSK-303', title: 'Common kitchen L4 — degrease rangehood', description: 'Monthly rangehood filter soak and degrease.',
    category: 'Cleaning', assigneeId: 's6', priority: 'Medium', status: 'Done', dueDate: dayOffset(-1), createdAt: dayOffset(-6),
    history: [{ at: stamp(1, 12, 10), by: 's6', text: 'Moved to Done' }],
  },
  {
    id: 'TSK-302', title: 'Audit key register against occupancy', description: 'Reconcile spare keys with current occupancy list.',
    category: 'Reception', assigneeId: 's2', priority: 'Medium', status: 'Review', dueDate: dayOffset(2), createdAt: dayOffset(-5),
    history: [{ at: stamp(5, 10, 0), by: 's7', text: 'Task created and assigned to Tom Becker' }],
  },
  {
    id: 'TSK-301', title: 'Service rooftop BBQs', description: 'Clean plates, check gas bottles, replace igniter on BBQ 2.',
    category: 'Maintenance', assigneeId: 's4', priority: 'Low', status: 'To Do', dueDate: dayOffset(-2), createdAt: dayOffset(-8),
    history: [{ at: stamp(8, 10, 0), by: 's7', text: 'Task created and assigned to Lena Ortiz' }],
  },
  {
    id: 'TSK-300', title: 'Update staff roster for next fortnight', description: 'Include public holiday cover for reception.',
    category: 'Management', assigneeId: 's7', priority: 'High', status: 'In Progress', dueDate: dayOffset(2), createdAt: dayOffset(-2),
    history: [{ at: stamp(2, 8, 0), by: 's7', text: 'Task created' }],
  },
  {
    id: 'TSK-299', title: 'Window cleaning — ground floor lobby', description: 'Inside and outside glass of the main entrance.',
    category: 'Cleaning', assigneeId: 's5', priority: 'Low', status: 'To Do', dueDate: dayOffset(6), createdAt: dayOffset(-1),
    history: [{ at: stamp(1, 9, 0), by: 's5', text: 'Task created' }],
  },
]

export const movements: Movement[] = [
  { id: 'CI-2201', type: 'Check-in', resident: 'Jordan Ellery', room: '0512', date: dayOffset(0), time: '10:00', status: 'Completed', documents: 'Complete', staffId: 's1' },
  { id: 'CI-2202', type: 'Check-in', resident: 'Mei Tanaka-Ross', room: '0918', date: dayOffset(0), time: '12:30', status: 'Expected', documents: 'Complete', staffId: 's1' },
  { id: 'CI-2203', type: 'Check-in', resident: 'Ravi Castellano', room: '1107', date: dayOffset(0), time: '14:00', status: 'Expected', documents: 'Missing ID', staffId: 's2' },
  { id: 'CI-2204', type: 'Check-in', resident: 'Hannah Voss', room: '0304', date: dayOffset(0), time: '15:30', status: 'Expected', documents: 'Awaiting contract', staffId: 's2' },
  { id: 'CI-2205', type: 'Check-in', resident: 'Kofi Brandt', room: '1412', date: dayOffset(0), time: '17:00', status: 'Expected', documents: 'Complete', staffId: 's1' },
  { id: 'CI-2206', type: 'Check-in', resident: 'Isla Moreau', room: '0721', date: dayOffset(1), time: '11:00', status: 'Expected', documents: 'Complete', staffId: 's1' },
  { id: 'CO-1180', type: 'Check-out', resident: 'Sam Petrakis', room: '0611', date: dayOffset(0), time: '10:00', status: 'Completed', documents: 'Not required', staffId: 's2' },
  { id: 'CO-1181', type: 'Check-out', resident: 'Ava Lindqvist', room: '1009', date: dayOffset(0), time: '11:00', status: 'Expected', documents: 'Not required', staffId: 's2' },
  { id: 'CO-1182', type: 'Check-out', resident: 'Noah Ferreira', room: '0215', date: dayOffset(-1), time: '10:00', status: 'Overdue', documents: 'Not required', staffId: 's1' },
]

export const complaints: Complaint[] = [
  { id: 'CMP-088', category: 'Noise', room: '0804', summary: 'Repeated late-night music reported by neighbours', status: 'Investigating', assigneeId: 's7', followUp: dayOffset(1), sensitive: false },
  { id: 'CMP-087', category: 'Cleanliness', room: 'L4 Kitchen', summary: 'Shared kitchen left with unwashed dishes overnight', status: 'Open', assigneeId: 's5', followUp: dayOffset(0), sensitive: false },
  { id: 'CMP-086', category: 'Safety', room: '1201', summary: 'Resident wellbeing concern raised by flatmate', status: 'Awaiting follow-up', assigneeId: 's7', followUp: dayOffset(0), sensitive: true },
  { id: 'CMP-085', category: 'Neighbour dispute', room: '0517', summary: 'Disagreement over shared fridge space', status: 'Open', assigneeId: 's1', followUp: dayOffset(2), sensitive: false },
  { id: 'CMP-084', category: 'Facilities', room: 'Laundry', summary: 'Dryer 3 not heating, residents losing credit', status: 'Resolved', assigneeId: 's2', followUp: dayOffset(-2), sensitive: false },
]

export const inspections: Inspection[] = [
  { id: 'INS-540', area: '0512', type: 'Room', scheduled: dayOffset(0), inspectorId: 's5', status: 'Scheduled', notes: 'Pre-arrival turnover check' },
  { id: 'INS-539', area: '0918', type: 'Room', scheduled: dayOffset(0), inspectorId: 's5', status: 'Scheduled', notes: 'Pre-arrival turnover check' },
  { id: 'INS-538', area: 'L3 Common Room', type: 'Common area', scheduled: dayOffset(1), inspectorId: 's6', status: 'Scheduled', notes: 'Weekly common-area check' },
  { id: 'INS-537', area: '0611', type: 'Room', scheduled: dayOffset(-1), inspectorId: 's5', status: 'Re-inspection Required', notes: 'Carpet stain near desk; chair damaged' },
  { id: 'INS-536', area: '1009', type: 'Room', scheduled: dayOffset(1), inspectorId: 's6', status: 'Scheduled', notes: 'Departure inspection' },
  { id: 'INS-535', area: 'Gym', type: 'Common area', scheduled: dayOffset(-2), inspectorId: 's5', status: 'Passed', notes: 'All equipment wiped down' },
  { id: 'INS-534', area: '0707', type: 'Room', scheduled: dayOffset(-3), inspectorId: 's6', status: 'Failed', notes: 'Bathroom mould — maintenance raised' },
]

export const transfers: Transfer[] = [
  { id: 'TR-061', resident: 'Leo Achterberg', fromRoom: '0804', toRoom: '1215', reason: 'Requested quieter floor', approval: 'Approved', moveDate: dayOffset(2) },
  { id: 'TR-062', resident: 'Zara Quillon', fromRoom: '0303', toRoom: '0310', reason: 'Accessibility — closer to lift', approval: 'Requested', moveDate: dayOffset(5) },
  { id: 'TR-063', resident: 'Felix Danjuma', fromRoom: '1418', toRoom: '0922', reason: 'Joining friends’ apartment', approval: 'Approved', moveDate: dayOffset(4) },
  { id: 'TR-060', resident: 'Ruby Halvorsen', fromRoom: '0505', toRoom: '0612', reason: 'Room maintenance relocation', approval: 'Declined', moveDate: dayOffset(-1) },
]

const roomTypes: Room['type'][] = ['Studio', 'Ensuite', '2-Bed Apartment', '4-Bed Apartment', 'Accessible Studio']
const roomStatuses: Room['status'][] = ['Occupied', 'Occupied', 'Occupied', 'Available', 'Occupied', 'Reserved', 'Occupied', 'Out of order', 'Occupied', 'Available']
export const rooms: Room[] = Array.from({ length: 40 }, (_, i) => {
  const floor = Math.floor(i / 5) + 2
  const num = (i % 5) + 1
  const status = roomStatuses[i % roomStatuses.length]
  return {
    number: `${String(floor).padStart(2, '0')}${String(num * 3).padStart(2, '0')}`,
    floor,
    type: roomTypes[(i * 3) % roomTypes.length],
    status,
    bookedUntil: status === 'Occupied' || status === 'Reserved' ? dayOffset(30 + ((i * 17) % 200)) : null,
  }
})

export const activities: Activity[] = [
  { id: 'a1', at: stamp(0, 9, 5), byId: 's4', text: 'started work on MR-1047 · Kitchen power point (0815)', module: 'Maintenance' },
  { id: 'a2', at: stamp(0, 8, 42), byId: 's1', text: 'logged urgent request MR-1048 · Water leak (1204)', module: 'Maintenance' },
  { id: 'a3', at: stamp(0, 10, 4), byId: 's1', text: 'checked in Jordan Ellery to room 0512', module: 'Check-ins' },
  { id: 'a4', at: stamp(0, 10, 12), byId: 's2', text: 'completed check-out for room 0611', module: 'Check-ins' },
  { id: 'a5', at: stamp(1, 16, 0), byId: 's7', text: 'assigned TSK-311 to Priya Nair', module: 'Tasks' },
  { id: 'a6', at: stamp(1, 15, 30), byId: 's5', text: 'flagged INS-537 (0611) for re-inspection', module: 'Inspections' },
  { id: 'a7', at: stamp(1, 13, 15), byId: 's7', text: 'approved transfer TR-061 · 0804 → 1215', module: 'Transfers' },
]

/** Weekly maintenance throughput for the last 8 weeks (demo history). */
export const maintenanceTrend = Array.from({ length: 8 }, (_, i) => {
  const weeksAgo = 7 - i
  const opened = [18, 22, 17, 25, 21, 19, 24, 20][i]
  const completed = [15, 20, 19, 21, 23, 18, 22, 17][i]
  return { weekOf: dayOffset(-weeksAgo * 7), opened, completed }
})
