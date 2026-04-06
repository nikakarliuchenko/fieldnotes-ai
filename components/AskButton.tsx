'use client'

export default function AskButton() {
  return (
    <button
      onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
      aria-label="Search field notes"
      title="Ask ✦ (⌘K)"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '11px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 14px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      Ask {'\u2726'}
    </button>
  )
}
