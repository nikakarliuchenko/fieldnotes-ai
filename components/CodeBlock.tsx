'use client'

import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
  caption?: string
}

export default function CodeBlock({ code, language, filename, caption }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const label = language || filename

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <figure>
      <pre>
        {label && (
          <div className="code-header">
            <span className="code-lang">{label}</span>
            <button className="code-copy" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
        <code>{code}</code>
      </pre>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
