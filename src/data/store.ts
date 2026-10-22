import { Store, useSelector } from '@tanstack/react-store'
import {
  activities,
  maintenanceRequests,
  staff,
  staffTasks,
  today,
  type Activity,
  type MaintenanceRequest,
  type Role,
  type StaffTask,
} from './fixtures'

/**
 * Client-side demo state. Changes live in memory for the browser session only
 * and reset on reload — persistence arrives with the Netlify Database milestone.
 */
type PortalState = {
  currentUserId: string
  maintenance: MaintenanceRequest[]
  tasks: StaffTask[]
  activities: Activity[]
}

/** The demo user shown for each previewed role. */
export const demoUserForRole: Record<Role, string> = {
  admin: 's8',
  manager: 's7',
  reception: 's1',
  maintenance: 's3',
  cleaning: 's5',
}

export const portalStore = new Store<PortalState>({
  currentUserId: 's7',
  maintenance: maintenanceRequests,
  tasks: staffTasks,
  activities,
})

export function staffById(id: string | null | undefined) {
  return staff.find((s) => s.id === id)
}

export function useCurrentUser() {
  const id = useSelector(portalStore, (s) => s.currentUserId)
  return staffById(id)!
}

export function usePortal<T>(selector: (s: PortalState) => T) {
  return useSelector(portalStore, selector)
}

export function setRole(role: Role) {
  portalStore.setState((s) => ({ ...s, currentUserId: demoUserForRole[role] }))
}

function logActivity(s: PortalState, text: string, module: Activity['module']): Activity[] {
  return [
    { id: crypto.randomUUID(), at: new Date().toISOString(), byId: s.currentUserId, text, module },
    ...s.activities,
  ]
}

function nextId(prefix: string, ids: string[]) {
  const max = Math.max(...ids.map((id) => Number(id.split('-')[1]) || 0))
  return `${prefix}-${max + 1}`
}

export function addMaintenance(
  input: Omit<MaintenanceRequest, 'id' | 'history' | 'reportedById' | 'createdAt' | 'status'>,
) {
  const id = nextId('MR', portalStore.state.maintenance.map((m) => m.id))
  portalStore.setState((s) => {
    const now = new Date()
    const req: MaintenanceRequest = {
      ...input,
      id,
      status: 'Pending',
      reportedById: s.currentUserId,
      createdAt: today(),
      history: [{ at: now.toISOString(), by: s.currentUserId, text: 'Request submitted' }],
    }
    return {
      ...s,
      maintenance: [req, ...s.maintenance],
      activities: logActivity(s, `logged ${id} · ${input.title} (${input.room})`, 'Maintenance'),
    }
  })
  return id
}

export function updateMaintenance(id: string, patch: Partial<MaintenanceRequest>, note: string) {
  portalStore.setState((s) => ({
    ...s,
    maintenance: s.maintenance.map((m) =>
      m.id === id
        ? {
            ...m,
            ...patch,
            completedAt:
              patch.status === 'Completed' ? today() : patch.status ? undefined : m.completedAt,
            history: [...m.history, { at: new Date().toISOString(), by: s.currentUserId, text: note }],
          }
        : m,
    ),
    activities: logActivity(s, `${note.charAt(0).toLowerCase()}${note.slice(1)} on ${id}`, 'Maintenance'),
  }))
}

export function addTask(input: Omit<StaffTask, 'id' | 'history' | 'createdAt' | 'status'>) {
  portalStore.setState((s) => {
    const id = nextId('TSK', s.tasks.map((t) => t.id))
    const assignee = staffById(input.assigneeId)?.name ?? 'unassigned'
    const now = new Date()
    const task: StaffTask = {
      ...input,
      id,
      status: 'To Do',
      createdAt: today(),
      history: [{ at: now.toISOString(), by: s.currentUserId, text: `Task created and assigned to ${assignee}` }],
    }
    return {
      ...s,
      tasks: [task, ...s.tasks],
      activities: logActivity(s, `assigned ${id} to ${assignee}`, 'Tasks'),
    }
  })
}

export function updateTask(id: string, patch: Partial<StaffTask>, note: string) {
  portalStore.setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === id
        ? { ...t, ...patch, history: [...t.history, { at: new Date().toISOString(), by: s.currentUserId, text: note }] }
        : t,
    ),
    activities: logActivity(s, `${note.charAt(0).toLowerCase()}${note.slice(1)} on ${id}`, 'Tasks'),
  }))
}
