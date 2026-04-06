'use client'

export default function AskButton() {
  return (
    <button
      className="nav-ico"
      onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
      aria-label="Ask field notes"
      title="Ask anything (⌘K)"
      style={{
        fontFamily: 'var(--mono)',
        fontSize: '11px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0',
        alignSelf: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      Ask <span style={{ fontSize: '14px', lineHeight: 1 }}>{'\u2726'}</span>
    </button>
  )
}
