import Link from 'next/link'
import type { ParsedFieldNote } from '@/lib/types'

interface FieldNoteCardProps {
  note: ParsedFieldNote
  variant?: 'list' | 'featured'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getTagClass(entryType: string): string {
  switch (entryType) {
    case 'Learning':
      return 'tag-learning'
    case 'Building':
      return 'tag-building'
    case 'Testing':
      return 'tag-testing'
    case 'Observing':
    default:
      return 'tag-observing'
  }
}

function formatEntryNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}

export default function FieldNoteCard({ note, variant = 'list' }: FieldNoteCardProps) {
  if (variant === 'featured') {
    return (
      <article className="featured-note">
        <div className="featured-note-header">
          <span className="entry-number">{formatEntryNumber(note.entryNumber)}</span>
          <span className={`tag ${getTagClass(note.entryType)}`}>{note.entryType}</span>
          <span className="entry-date">{formatDate(note.publishedDate)}</span>
        </div>

        <h2 className="featured-note-title">
          <Link href={`/notes/${note.slug}`}>{note.title}</Link>
        </h2>

        {note.dek && (
          <p className="featured-note-dek">{note.dek}</p>
        )}

        <Link href={`/notes/${note.slug}`} className="read-more-link">
          Read full note &rarr;
        </Link>

        <style jsx>{`
          .featured-note {
            margin-bottom: 48px;
          }

          .featured-note-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
          }

          .entry-number {
            font-family: var(--font-mono);
            font-size: 0.7rem;
            color: var(--accent);
            font-weight: 500;
          }

          .entry-date {
            font-family: var(--font-mono);
            font-size: 0.58rem;
            color: var(--muted);
            margin-left: auto;
          }

          .featured-note-title {
            font-family: var(--font-heading);
            font-size: 2rem;
            font-weight: 700;
            margin: 0 0 16px;
            line-height: 1.2;
          }

          .featured-note-title a {
            color: var(--ink);
            text-decoration: none;
            transition: opacity 0.2s;
          }

          .featured-note-title a:hover {
            opacity: 0.7;
          }

          .featured-note-dek {
            font-family: var(--font-body);
            font-style: italic;
            color: var(--muted);
            font-size: 1rem;
            line-height: 1.6;
            margin: 0 0 24px;
            padding-left: 16px;
            border-left: 2px solid var(--accent);
          }

          .read-more-link {
            font-family: var(--font-mono);
            font-size: 0.62rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--accent);
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .read-more-link:hover {
            opacity: 0.7;
          }
        `}</style>
      </article>
    )
  }

  // List variant
  return (
    <Link href={`/notes/${note.slug}`} className="note-row">
      <span className="note-number">{formatEntryNumber(note.entryNumber)}</span>
      <div className="note-content">
        <h3 className="note-title">{note.title}</h3>
        {note.dek && <p className="note-excerpt">{note.dek}</p>}
      </div>
      <div className="note-meta">
        <span className={`tag ${getTagClass(note.entryType)}`}>{note.entryType}</span>
        <span className="note-date">{formatDate(note.publishedDate)}</span>
      </div>

      <style jsx>{`
        .note-row {
          display: grid;
          grid-template-columns: 48px 1fr auto;
          gap: 16px;
          padding: 16px 0;
          border-bottom: 1px solid var(--rule);
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .note-row:hover {
          opacity: 0.55;
        }

        .note-number {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 500;
        }

        .note-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .note-title {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
        }

        .note-excerpt {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.78rem;
          color: var(--muted);
          margin: 0;
          line-height: 1.4;
        }

        .note-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .note-date {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          color: var(--muted);
        }

        @media (max-width: 640px) {
          .note-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .note-meta {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>
    </Link>
  )
}
