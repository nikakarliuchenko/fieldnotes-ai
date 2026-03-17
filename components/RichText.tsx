import { documentToReactComponents, Options } from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, MARKS, Document, Block, Inline } from '@contentful/rich-text-types'
import Image from 'next/image'
import { ReactNode } from 'react'
import CodeBlock from './CodeBlock'

interface RichTextProps {
  content: Document
  showDropCap?: boolean
}

const options: Options = {
  renderMark: {
    [MARKS.BOLD]: (text: ReactNode) => <strong>{text}</strong>,
    [MARKS.ITALIC]: (text: ReactNode) => <em>{text}</em>,
    [MARKS.CODE]: (text: ReactNode) => <code>{text}</code>,
  },
  renderNode: {
    [BLOCKS.PARAGRAPH]: (_node: Block | Inline, children: ReactNode) => (
      <p>{children}</p>
    ),
    [BLOCKS.HEADING_2]: (_node: Block | Inline, children: ReactNode) => (
      <h2>{children}</h2>
    ),
    [BLOCKS.HEADING_3]: (_node: Block | Inline, children: ReactNode) => (
      <h3>{children}</h3>
    ),
    [BLOCKS.HEADING_4]: (_node: Block | Inline, children: ReactNode) => (
      <h4>{children}</h4>
    ),
    [BLOCKS.UL_LIST]: (_node: Block | Inline, children: ReactNode) => (
      <ul>{children}</ul>
    ),
    [BLOCKS.OL_LIST]: (_node: Block | Inline, children: ReactNode) => (
      <ol>{children}</ol>
    ),
    [BLOCKS.LIST_ITEM]: (_node: Block | Inline, children: ReactNode) => (
      <li>{children}</li>
    ),
    [BLOCKS.QUOTE]: (_node: Block | Inline, children: ReactNode) => (
      <blockquote>{children}</blockquote>
    ),
    [BLOCKS.HR]: () => <hr className="art-divider" />,
    [BLOCKS.EMBEDDED_ASSET]: (node: Block | Inline) => {
      const fields = node.data.target?.fields
      if (!fields) return null

      const file = fields.file
      const title = fields.title as string | undefined
      const description = fields.description as string | undefined

      if (!file?.url || !file.contentType?.startsWith('image/')) return null

      const url = `https:${file.url}`
      const width = file.details?.image?.width || 800
      const height = file.details?.image?.height || 450

      return (
        <figure className="art-img">
          <div className="art-img-inner">
            <Image
              src={url}
              alt={description || title || ''}
              width={width}
              height={height}
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          {description && <figcaption>{description}</figcaption>}
        </figure>
      )
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node: Block | Inline) => {
      const entry = node.data.target
      if (!entry?.sys?.contentType?.sys?.id) return null

      const contentType = entry.sys.contentType.sys.id

      switch (contentType) {
        case 'codeSnippet':
          return (
            <CodeBlock
              code={entry.fields.code}
              language={entry.fields.language}
              filename={entry.fields.filename}
              caption={entry.fields.caption}
            />
          )
        default:
          return null
      }
    },
    [INLINES.HYPERLINK]: (node: Block | Inline, children: ReactNode) => {
      const { uri } = node.data
      const isExternal = typeof uri === 'string' && uri.startsWith('http')
      return (
        <a
          href={uri}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
  },
}

export default function RichText({ content, showDropCap = false }: RichTextProps) {
  return (
    <div className={`art-body${showDropCap ? ' with-drop-cap' : ''}`}>
      {documentToReactComponents(content, options)}
    </div>
  )
}
