import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, Document, Block, Inline } from '@contentful/rich-text-types'
import { ReactNode } from 'react'

interface RichTextProps {
  content: Document
  showDropCap?: boolean
}

const options: Options = {
  renderNode: {
    [BLOCKS.PARAGRAPH]: (node: Block | Inline, children: ReactNode) => (
      <p>{children}</p>
    ),
    [BLOCKS.HEADING_2]: (node: Block | Inline, children: ReactNode) => (
      <h2>{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (node: Block | Inline, children: ReactNode) => (
      <h3>{children}</h3>
    ),
    [BLOCKS.HEADING_4]: (node: Block | Inline, children: ReactNode) => (
      <h4>{children}</h4>
    ),
    [BLOCKS.UL_LIST]: (node: Block | Inline, children: ReactNode) => (
      <ul className="list-disc pl-6 my-4 [&_p]:!my-0 [&_li]:my-0">{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (node: Block | Inline, children: ReactNode) => (
      <ol className="list-decimal pl-6 my-4 [&_p]:!my-0 [&_li]:my-0">{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (node: Block | Inline, children: ReactNode) => (
      <li>{children}</li>
    ),
    [BLOCKS.QUOTE]: (node: Block | Inline, children: ReactNode) => (
      <blockquote>{children}</blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="my-8 border-t border-stone-300" />,
    [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
      const { title, file } = node.data.target.fields
      const url = file?.url ? `https:${file.url}` : ''
      const alt = title || ''
      return (
        <figure className="my-8">
          <img src={url} alt={alt} className="w-full rounded" loading="lazy" />
          {alt && <figcaption className="mt-2 text-sm text-center" style={{ color: 'var(--ink-2)' }}>{alt}</figcaption>}
        </figure>
      )
    },
    [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) => {
      const { uri } = node.data
      return (
        <a href={uri} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },
  },
}

export default function RichText({ content, showDropCap = false }: RichTextProps) {
  return (
    <div className={`rich-text ${showDropCap ? 'with-drop-cap' : ''}`}>
      {documentToReactComponents(content, options)}

    </div>
  )
}
