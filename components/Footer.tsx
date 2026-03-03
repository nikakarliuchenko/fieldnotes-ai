interface FooterProps {
  copyright?: string
}

export default function Footer({ copyright }: FooterProps) {
  return (
    <footer className="footer">
      <span className="footer-title">FieldNotes AI</span>
      <span className="footer-copyright">&copy; {copyright || '2026 Nika Karliuchenko'}</span>

      <style jsx>{`
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 0;
          margin-top: 64px;
          border-top: 1px solid var(--rule);
        }

        .footer-title {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 1rem;
          color: var(--ink);
        }

        .footer-copyright {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
        }

        @media (max-width: 640px) {
          .footer {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  )
}
