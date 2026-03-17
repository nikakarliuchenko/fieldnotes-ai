'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavLinkProps {
  href: string
  children: React.ReactNode
  openInNewTab?: boolean
  isExternal?: boolean
}

export default function NavLink({ href, children, openInNewTab, isExternal }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      data-active={isActive ? '' : undefined}
      aria-current={isActive ? 'page' : undefined}
      target={openInNewTab ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
    >
      {children}
    </Link>
  )
}
