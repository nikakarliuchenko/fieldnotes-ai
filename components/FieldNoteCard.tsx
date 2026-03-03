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

    </Link>
  )
}
