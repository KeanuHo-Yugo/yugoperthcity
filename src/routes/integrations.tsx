import { createFileRoute } from '@tanstack/react-router'
import { Badge, PageHeader } from '@/components/ui'

export const Route = createFileRoute('/integrations')({
  head: () => ({ meta: [{ title: 'Integrations · Yugo Ops' }] }),
  component: Integrations,
})

const integrations = [
  { name: 'Microsoft Entra ID', use: 'Staff single sign-on and role assignment from your Microsoft 365 groups.', needs: 'App registration, tenant ID, redirect URL and group-to-role mapping.' },
  { name: 'Microsoft Teams', use: 'Post urgent maintenance and overdue task alerts to team channels; pin the portal as a Teams tab.', needs: 'Incoming webhook or Teams app manifest per channel.' },
  { name: 'Microsoft Outlook', use: 'Email reminders for follow-ups, inspections and deadlines.', needs: 'Microsoft Graph mail permission on the app registration.' },
  { name: 'Power Automate', use: 'Trigger flows when records are created or change status.', needs: 'Outgoing webhook endpoints and a signed shared secret.' },
  { name: 'SharePoint / Dataverse', use: 'Sync records to existing SharePoint lists or Dataverse tables.', needs: 'Decision on system of record, then Graph / Dataverse API access.' },
]

function Integrations() {
  return (
    <div>
      <PageHeader title="Integrations" description="Connections to your Microsoft 365 environment. None are active yet — each needs to be configured and tested first." />
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((i) => (
          <div key={i.name} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-bold">{i.name}</h2>
              <Badge>Not configured</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{i.use}</p>
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-xs text-ink-muted"><span className="font-semibold text-ink-soft">Setup needed:</span> {i.needs}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
