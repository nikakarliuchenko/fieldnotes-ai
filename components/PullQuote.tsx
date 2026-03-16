import type { ReactNode } from 'react'

interface PullQuoteProps {
  children: ReactNode
}

export default function PullQuote({ children }: PullQuoteProps) {
  return <div className="pull-quote">{children}</div>
}
