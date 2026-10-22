# Yugo Perth City — Operations Portal

An internal operations portal for Yugo Perth City staff (reception, maintenance, cleaning and building managers). It brings the daily-operations spreadsheets together in one place: maintenance requests, staff tasks, check-ins and check-outs, room availability, inspections, complaints, room transfers and reports.

> **Prototype status:** every resident, room and staff member shown is **fictional demo data**. Changes made in the browser are not saved and reset on reload. Staff sign-in, server-side permissions and Microsoft 365 integrations are **not configured yet** (see the roadmap).

## What works today
- **Dashboard**: live summary cards, urgent and overdue items, charts, recent activity, quick actions.
- **Maintenance**: log, filter, sort, assign and progress requests (Pending → In Progress → Completed), with history and CSV export.
- **Staff Tasks**: Kanban board (drag-and-drop) and calendar view, task assignment, priorities, deadlines and overdue highlighting.
- Preview screens for the remaining modules, global search, notifications, and a role preview (Administrator, Manager, Reception, Maintenance, Cleaning) in the profile menu.

## Tech
- [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) on Netlify
- Tailwind CSS v4, lucide-react icons
- Chart.js via react-chartjs-2
- TanStack Store for client-side demo state

## Run locally
```bash
pnpm install
netlify dev        # or: pnpm dev
```

## Roadmap
See [PLAN.md](./PLAN.md). Next up: staff sign-in (Microsoft Entra ID), then persistent storage in Netlify Database with server-side role checks and audit logging. After that come the remaining modules, Excel/CSV import, reports, and the Microsoft 365 integrations.
