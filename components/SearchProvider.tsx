'use client'

import { useEffect, useState } from 'react'
import { SearchModal } from './SearchModal'

export function SearchProvider({
  children,
  fieldNoteSlugs,
}: {
  children: React.ReactNode
  fieldNoteSlugs: Record<string, string>
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    function handleOpenSearch() {
      setOpen(true)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('open-search', handleOpenSearch)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('open-search', handleOpenSearch)
    }
  }, [])

  return (
    <>
      {children}
      <SearchModal
        isOpen={open}
        onClose={() => setOpen(false)}
        fieldNoteSlugs={fieldNoteSlugs}
      />
    </>
  )
}
