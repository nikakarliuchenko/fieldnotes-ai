import Link from 'next/link'

interface ArticleNavNote {
  slug: string
  title: string
}

interface ArticleNavProps {
  prevNote?: ArticleNavNote | null
  nextNote?: ArticleNavNote | null
}

export default function ArticleNav({ prevNote, nextNote }: ArticleNavProps) {
  if (!prevNote && !nextNote) return null

  return (
    <nav className="art-nav" aria-label="Article navigation">
      <div className={`art-nav-item${!prevNote ? '' : ''}`}>
        {prevNote && (
          <>
            <div className="art-nav-dir">&larr; Previous</div>
            <Link href={`/notes/${prevNote.slug}`} className="art-nav-title">
              {prevNote.title}
            </Link>
          </>
        )}
      </div>
      <div className="art-nav-item next">
        {nextNote && (
          <>
            <div className="art-nav-dir">Next &rarr;</div>
            <Link href={`/notes/${nextNote.slug}`} className="art-nav-title">
              {nextNote.title}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
