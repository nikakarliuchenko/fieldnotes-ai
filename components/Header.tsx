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
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_6663-uErCtyFxNVjSM7dYKeROkpSDDJjF15.jpeg"
              alt="Nika Karliuchenko"
              className="header-photo"
              loading="eager"
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

    </header>
  )
}
