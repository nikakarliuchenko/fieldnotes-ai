import type { ParsedSocialLink } from '@/lib/types'

interface AboutStripProps {
  socialLinks: ParsedSocialLink[]
}

export default function AboutStrip({ socialLinks }: AboutStripProps) {
  return (
    <section id="about" className="about-strip">
      <p className="about-bio">
        <strong>Nika Karliuchenko</strong> is a content infrastructure specialist exploring the 
        intersection of structured content and artificial intelligence. Based in Boston, she 
        documents her experiments and observations in this field journal.
      </p>
      
      <div className="about-links">
        {socialLinks.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link"
          >
            {link.platform}
          </a>
        ))}
      </div>

    </section>
  )
}
