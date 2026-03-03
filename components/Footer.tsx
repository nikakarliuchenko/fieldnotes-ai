import type { ParsedSocialLink } from '@/lib/types'

interface FooterProps {
  copyright?: string
  socialLinks?: ParsedSocialLink[]
}

export default function Footer({ copyright, socialLinks = [] }: FooterProps) {
  return (
    <footer className="footer">
      <span className="footer-title">FieldNotes AI</span>
      {socialLinks.length > 0 && (
        <div className="footer-social">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              {link.platform}
            </a>
          ))}
        </div>
      )}
      <span className="footer-copyright">&copy; {copyright || '2026 Nika Karliuchenko'}</span>
    </footer>
  )
}
