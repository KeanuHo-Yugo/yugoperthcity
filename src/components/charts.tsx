import { useEffect, useState, type ReactNode } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

ChartJS.defaults.font.family = '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
ChartJS.defaults.color = '#4b5a63'
ChartJS.defaults.plugins.tooltip.backgroundColor = '#0f1d24'
ChartJS.defaults.plugins.tooltip.padding = 10
ChartJS.defaults.plugins.tooltip.cornerRadius = 10
ChartJS.defaults.plugins.legend.labels.usePointStyle = true
ChartJS.defaults.plugins.legend.labels.pointStyle = 'rectRounded'

/** Categorical series colours, validated for colour-vision deficiency. */
export const series = {
  teal: '#00a19b',
  orange: '#eb6834',
  violet: '#6250d6',
  amber: '#eda100',
}

export const gridColor = '#eef2f4'

/** Chart.js needs the DOM — render charts only after hydration. */
export function ClientOnly({ children, fallbackHeight = 260 }: { children: ReactNode; fallbackHeight?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div style={{ height: fallbackHeight }} className="animate-pulse rounded-xl bg-canvas" />
  return <>{children}</>
}
