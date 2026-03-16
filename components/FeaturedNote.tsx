import Link from 'next/link'
import type { ParsedFieldNote } from '@/lib/types'
import { formatDate, formatEntryNumber, getTagClass } from '@/lib/format'

interface FeaturedNoteProps {
  note: ParsedFieldNote
}

export default function FeaturedNote({ note }: FeaturedNoteProps) {
  return (
    <article className="featured-note">
      <div className="featured-note-header">
        <span className="entry-number">{formatEntryNumber(note.entryNumber)}</span>
        <span className={`lbl ${getTagClass(note.entryType)}`}>{note.entryType}</span>
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
