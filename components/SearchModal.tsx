'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'

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

  function linkCitations(text: string) {
    return text.replace(/#(\d{3})/g, (match, num) => {
      const slug = fieldNoteSlugs[num]
      return slug ? `[${match}](/notes/${slug})` : match
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '15vh 16px 0',
        background: 'rgba(0, 0, 0, 0.6)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ paddingLeft: '16px', color: 'var(--ink-3)', userSelect: 'none' }}>{'\u2726'}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask anything — e.g. "how did you handle the git token leak?"'
            style={{
              flex: 1,
              padding: '16px 12px',
              fontSize: '14px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--ink)',
            }}
          />
          {loading ? (
            <span className="animate-pulse" style={{ paddingRight: '16px', fontSize: '12px', color: 'var(--ink-3)' }}>
              searching...
            </span>
          ) : !query && (
            <span style={{
              paddingRight: '16px',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              color: 'var(--ink-3)',
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}>
              {'\u2318'}K
            </span>
          )}
        </form>

        {(answer || loading) && (
          <div
            style={{
              padding: '16px',
              fontSize: '14px',
              color: 'var(--ink-2)',
              lineHeight: 1.6,
              minHeight: '80px',
            }}
          >
            {loading && !answer ? (
              <span style={{ color: 'var(--ink-3)' }}>Searching field notes...</span>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                  strong: ({ children }) => <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>,
                  a: ({ href, children }) => <a href={href} style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>{children}</a>,
                }}
              >
                {linkCitations(answer)}
              </ReactMarkdown>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
