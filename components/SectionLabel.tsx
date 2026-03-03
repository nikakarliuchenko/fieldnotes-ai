interface SectionLabelProps {
  children: React.ReactNode
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h2 className="section-label">
      {children}

      <style jsx>{`
        .section-label {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin: 0 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--rule);
          font-weight: 500;
        }
      `}</style>
    </h2>
  )
}
