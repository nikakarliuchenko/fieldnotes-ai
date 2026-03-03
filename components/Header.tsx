'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { ParsedNavigationItem, ParsedSocialLink } from '@/lib/types'

interface HeaderProps {
  navigation: ParsedNavigationItem[]
  socialLinks?: ParsedSocialLink[]
}

const socialIcons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  X: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
}

export default function Header({ navigation, socialLinks = [] }: HeaderProps) {
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
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG_6663-uErCtyFxNVjSM7dYKeROkpSDDJjF15.jpeg"
              alt="Nika Karliuchenko"
              width={304}
              height={384}
              className="header-photo"
              priority
              quality={95}
              sizes="(max-width: 640px) 100px, 152px"
            />
          </div>
          <div className="header-photo-accent"></div>
          <span className="header-photo-caption">Nika Karliuchenko</span>
          {socialLinks.length > 0 && (
            <div className="header-social">
              {socialLinks.map((link) => {
                const icon = socialIcons[link.platform]
                if (!icon) return null
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="header-social-link"
                    aria-label={link.platform}
                  >
                    {icon}
                  </a>
                )
              })}
            </div>
          )}
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
