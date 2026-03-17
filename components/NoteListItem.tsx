import Link from 'next/link'
import type { ParsedFieldNote } from '@/lib/types'
import { formatDate, formatEntryNumber, getTagClass } from '@/lib/format'

interface NoteListItemProps {
  note: ParsedFieldNote
}

export default function NoteListItem({ note }: NoteListItemProps) {
  return (
    <Link href={`/notes/${note.slug}`} className="note-row">
      <span className="note-number">{formatEntryNumber(note.entryNumber)}</span>
      <div className="note-content">
        <h3 className="note-title">{note.title}</h3>
        {note.dek && <p className="note-excerpt">{note.dek}</p>}
      </div>
      <div className="note-meta">
        <span className={`lbl ${getTagClass(note.entryType)}`}>{note.entryType}</span>
        <span className="note-date">{formatDate(note.publishedDate)}</span>
      </div>
    </Link>
  )
}
