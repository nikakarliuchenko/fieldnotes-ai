import type { ReactNode } from 'react'

interface CalloutProps {
  label?: string
  children: ReactNode
}

export default function Callout({ label = 'NOTE', children }: CalloutProps) {
  return (
    <div className="callout">
      <div className="callout-label">{label}</div>
      {children}
    </div>
  )
}
