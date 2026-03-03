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

      <style jsx>{`
        .about-strip {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 32px;
          padding: 32px 0;
          border-top: 1px solid var(--rule);
          margin-top: 48px;
        }

        .about-bio {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.6;
          margin: 0;
          max-width: 500px;
        }

        .about-bio strong {
          font-style: normal;
          color: var(--ink);
        }

        .about-links {
          display: flex;
          gap: 16px;
          flex-shrink: 0;
        }

        .social-link {
          font-family: var(--font-mono);
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .social-link:hover {
          color: var(--accent);
        }

        @media (max-width: 640px) {
          .about-strip {
            flex-direction: column;
            gap: 16px;
          }

          .about-links {
            align-self: flex-start;
          }
        }
      `}</style>
    </section>
  )
}
