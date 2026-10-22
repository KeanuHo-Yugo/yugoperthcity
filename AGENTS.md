# AGENTS.md — Yugo Perth City Operations Portal

Internal staff portal built with TanStack Start (React 19) and deployed on Netlify. **Read `PLAN.md` first.** It is the roadmap: milestone 1 (the product surface) is done, so continue from the next unfinished milestone.

## Architecture
- `src/routes/__root.tsx`: document shell, metadata and fonts. It wraps every page in `AppShell`.
- `src/components/AppShell.tsx`: collapsible sidebar (filtered by role), top bar with global search, notifications, profile and role preview. It shows a "no access" panel when the previewed role can't open the current module.
- `src/routes/index.tsx`: dashboard.
- `src/routes/maintenance.tsx` and `src/routes/tasks.tsx`: the fully interactive modules (forms, validation, status updates, history).
- `src/routes/{check-ins,rooms,inspections,complaints,transfers}.tsx`: read-only previews built on `src/components/ModulePreview.tsx`. Replace each one with a full module in its milestone.
- `src/routes/reports.tsx` and `src/routes/integrations.tsx`: reports preview and the Microsoft integration status page. Every integration shows "Not configured", so never mark one active without real configuration and testing.
- `src/data/fixtures.ts`: **the only source of demo data.** All of it is fictional. Dates are relative to "today" in the Australia/Perth timezone, so SSR and the browser agree.
- `src/data/store.ts`: TanStack Store holding mutable demo state (maintenance, tasks, activity) plus the action functions. Pages call these actions, never `setState` directly, so swapping to server functions later only touches this file.
- `src/lib/permissions.ts`: role → module access matrix, plus the own-work-only and sensitive-data rules. **This is currently UI-only and is not a security boundary.** It must be enforced server-side once a backend exists.
- `src/components/ui.tsx`: Badge, StatusBadge, PriorityBadge, Avatar, Modal, Field, Segmented and PageHeader. `src/components/charts.tsx` holds Chart.js registration, the validated series colours and `ClientOnly`.

## Conventions
- Brand tokens live in `src/styles.css` (`brand-*` teal scale, `ink`, `line`, `canvas`), along with the `card`, `input`, `btn-primary` and `btn-ghost` utilities. Use those instead of raw colours.
- Charts render inside `ClientOnly` (Chart.js needs the DOM). Use colours from `series`, and give two-series charts a legend.
- Forms validate on submit, then live after the first attempt. Error text sits under each field via `Field`.
- Every mutation appends a history entry and an activity item recording who and when. Keep this behaviour when moving to the database (audit_log).
- Status and priority colours always appear with a text label, never colour alone.
- Australian English in UI copy (e.g. "organise", "authorised").

## Non-obvious decisions
- The role switcher in the profile menu is a deliberate demo affordance. Remove it when real authentication lands.
- `navigate({ search: { new: true } })` opens the "new" modals, so dashboard quick actions can deep-link to them.
- Photo uploads currently create in-browser object URLs only. Netlify Blobs is planned.
