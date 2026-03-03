'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { ParsedNavigationItem } from '@/lib/types'

interface HeaderProps {
  navigation: ParsedNavigationItem[]
}

export default function Header({ navigation }: HeaderProps) {
  const pathname = usePathname()

  const isActive = (url: string) => {
    if (url === '/notes') return pathname === '/notes' || pathname.startsWith('/notes/')
    if (url === '/tools') return pathname === '/tools'
    if (url === '#about') return pathname === '/' && typeof window !== 'undefined' && window.location.hash === '#about'
    return pathname === url
  }

  return (
    <header className="header">
      <div className="header-meta">
        <span>Vol. I</span>
        <span className="header-meta-separator">·</span>
        <span>Boston, MA</span>
        <span className="header-meta-separator">·</span>
        <span>2026</span>
      </div>

      <div className="header-main">
        <div className="header-title-section">
          <Link href="/" className="header-title-link">
            <h1 className="header-title">
              FieldNotes<span className="header-title-ai">AI</span>
            </h1>
          </Link>
          <p className="header-tagline">
            What happens when content infrastructure meets AI
          </p>
        </div>

        <div className="header-photo-section">
          <div className="header-photo-container">
            <Image
              src="/nika.jpg"
              alt="Nika Karliuchenko"
              width={152}
              height={192}
              className="header-photo"
              priority
            />
          </div>
          <div className="header-photo-accent"></div>
          <span className="header-photo-caption">Nika Karliuchenko</span>
        </div>
      </div>

      <nav className="header-nav">
        {navigation.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            className={`header-nav-link ${isActive(item.url) ? 'active' : ''}`}
            target={item.openInNewTab ? '_blank' : undefined}
            rel={item.isExternal ? 'noopener noreferrer' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <style jsx>{`
        .header {
          padding-top: 32px;
          margin-bottom: 48px;
        }

        .header-meta {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-meta-separator {
          opacity: 0.5;
        }

        .header-main {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 32px;
          align-items: start;
          margin-bottom: 24px;
        }

        .header-title-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .header-title-link {
          text-decoration: none;
        }

        .header-title {
          font-family: var(--font-heading);
          font-size: 4.4rem;
          font-weight: 700;
          line-height: 1;
          color: var(--ink);
          margin: 0;
        }

        .header-title-ai {
          font-style: italic;
          color: var(--accent);
        }

        .header-tagline {
          font-family: var(--font-body);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          margin: 0;
        }

        .header-photo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header-photo-container {
          width: 152px;
          height: 192px;
          border: 1px solid var(--rule);
          overflow: hidden;
        }

        :global(.header-photo) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          filter: saturate(0.85);
        }

        .header-photo-accent {
          width: 152px;
          height: 2px;
          background-color: var(--accent);
          margin-top: 2px;
        }

        .header-photo-caption {
          font-family: var(--font-mono);
          font-size: 0.48rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-top: 6px;
        }

        .header-nav {
          display: flex;
          gap: 32px;
          padding: 12px 0;
          border-top: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }

        .header-nav-link {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ink);
          text-decoration: none;
          padding-bottom: 8px;
          transition: opacity 0.2s;
        }

        .header-nav-link:hover {
          opacity: 0.7;
        }

        .header-nav-link.active {
          border-bottom: 2px solid var(--accent);
        }

        @media (max-width: 640px) {
          .header-main {
            grid-template-columns: 1fr;
          }

          .header-title {
            font-size: 2.8rem;
          }

          .header-photo-section {
            order: -1;
            align-items: flex-start;
          }

          .header-photo-container {
            width: 100px;
            height: 126px;
          }

          .header-photo-accent {
            width: 100px;
          }

          .header-nav {
            gap: 16px;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </header>
  )
}
