interface FooterProps {
  copyright?: string
}

export default function Footer({ copyright }: FooterProps) {
  return (
    <footer className="footer">
      <span className="footer-title">FieldNotes AI</span>
      <span className="footer-copyright">&copy; {copyright || '2026 Nika Karliuchenko'}</span>

    </footer>
  )
}
