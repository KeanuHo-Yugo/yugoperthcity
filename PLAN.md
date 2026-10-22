# Yugo Perth City Operations Portal — Roadmap

The portal replaces the operations spreadsheets used by reception, maintenance, cleaning and building management. It is delivered in small milestones. Each one ships something staff can use.

## Milestone 1 — Product surface ✅ (done)
- Branded app shell: collapsible sidebar, global search (Ctrl/⌘ K), notifications, profile menu with a demo role preview.
- **Dashboard**: welcome message and date, 7 live summary cards, urgent and overdue list, throughput and workload charts, today's arrivals and departures, recent activity, quick actions.
- **Maintenance**: searchable, sortable and filterable table; active and history tabs; validated request form with photo preview and a duplicate warning; detail view with status updates, assignment, notes and change history; CSV export for managers.
- **Staff Tasks**: Kanban board with drag-and-drop, month calendar, overdue highlighting, validated create-and-assign form, task detail with reassignment and history.
- Read-only previews for Check-ins, Rooms, Inspections, Complaints, Transfers, Reports and Integrations.
- All data comes from `src/data/fixtures.ts`. Changes made in the browser are lost on reload.

## Milestone 2 — Staff sign-in and roles
- Pick the identity provider. The target is **Microsoft Entra ID** (SSO). Netlify Identity is the interim fallback if Entra is not ready.
- Map Entra groups (or Identity roles) to Administrator, Manager, Reception, Maintenance and Cleaning.
- Replace the demo role switcher with the signed-in user, and protect every route.

## Milestone 3 — Data model and persistence (Netlify Database)
- Drizzle schema in `db/schema.ts`: staff, rooms, residents, bookings/movements, maintenance_requests, tasks, inspections, complaints (with notes), transfers, and audit_log.
- Use unique identifiers (MR-, TSK-, INS-, CMP-, TR-) with unique constraints to prevent duplicates.
- Server functions for every read and write. Validate input and **check roles on the server** with the matrix in `src/lib/permissions.ts`. Maintenance and cleaning staff get only their own assigned records, and sensitive complaint fields go only to managers and admins.
- Write an audit log entry (who, what, when, before and after) on every change.
- Swap `src/data/store.ts` from fixtures to server data.

## Milestone 4 — Photo uploads
- Store maintenance and inspection photos in Netlify Blobs and serve them through the Image CDN.

## Milestone 5 — Check-in / Check-out module
- Full CRUD, configurable arrival and departure checklists, documentation tracking, and overdue alerts.

## Milestone 6 — Room availability and spreadsheet import
- Room CRUD and a booking calendar view.
- Excel and CSV import with column mapping, validation preview, and duplicate detection on room number or booking ID. The same importer is reused for the other modules.

## Milestone 7 — Inspections
- Scheduling, mobile checklist with photos, Passed / Failed / Re-inspection outcomes, follow-up maintenance requests created from failed items, and printable summaries.

## Milestone 8 — Complaints and incidents
- Case logging, assignment, chronological case history, internal notes, follow-up dates, resolution, and sensitive-field restrictions enforced on the server.

## Milestone 9 — Room transfers
- Request and approval workflow, transfer checklist, and automatic room availability updates.

## Milestone 10 — Reports and analytics
- Filters by date, category and staff member. Complaint resolution times, inspection pass rates, and workload trends. Excel (.xlsx) and CSV export for authorised roles.

## Milestone 11 — Microsoft 365 integrations
Each integration stays labelled "Not configured" until it has been set up and tested.
- Teams: channel alerts for urgent and overdue items, and the portal as a Teams tab.
- Outlook: reminder emails through Microsoft Graph.
- Power Automate: signed outgoing webhooks on record events.
- SharePoint / Dataverse: sync, once the system of record is decided.
