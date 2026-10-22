import { today } from '@/data/fixtures'

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', opts)
}

export function relativeDay(iso: string) {
  const t = today()
  const diff = Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(t)) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

export function isOverdue(dueIso: string, done: boolean) {
  return !done && dueIso < today()
}
