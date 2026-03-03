interface SectionLabelProps {
  children: React.ReactNode
}

export default function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h2 className="section-label">
      {children}

    </h2>
  )
}
