'use client'

export default function AskButton() {
  return (
    <button
      className="nav-ico"
      onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
      aria-label="Search field notes"
      title="Ask anything (⌘K)"
    >
      {'\u2726'}
    </button>
  )
}
