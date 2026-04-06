'use client'

import { useEffect, useRef, useState } from 'react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  fieldNoteSlugs: Record<string, string>
}

export function SearchModal({ isOpen, onClose, fieldNoteSlugs }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setAnswer('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setAnswer('')

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error('Search failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setAnswer((prev) => prev + decoder.decode(value))
      }
    } catch {
      setAnswer('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function renderAnswer(text: string) {
    const parts = text.split(/(#\d{3})/g)
    return parts.map((part, i) => {
      const match = part.match(/^#(\d{3})$/)
      if (match) {
        const slug = fieldNoteSlugs[match[1]]
        if (slug) {
          return (
            <a key={i} href={`/notes/${slug}`} className="underline underline-offset-2">
              {part}
            </a>
          )
        }
      }
      return <span key={i}>{part}</span>
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSearch} className="flex items-center border-b border-zinc-200 dark:border-zinc-700">
          <span className="pl-4 text-zinc-400 select-none">{'\u2726'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask anything — e.g. "how did you handle the git token leak?"'
            className="flex-1 px-3 py-4 text-sm bg-transparent outline-none placeholder:text-zinc-400"
          />
          {loading && (
            <span className="pr-4 text-xs text-zinc-400 animate-pulse">searching...</span>
          )}
        </form>

        {(answer || loading) && (
          <div className="px-4 py-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[80px]">
            {loading && !answer ? (
              <span className="text-zinc-400">Searching field notes...</span>
            ) : (
              renderAnswer(answer)
            )}
          </div>
        )}
      </div>
    </div>
  )
}
