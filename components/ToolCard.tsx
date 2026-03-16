import type { ParsedTool } from '@/lib/types'

interface ToolCardProps {
  tool: ParsedTool
  featured?: boolean
}

function getDisplayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function ToolIcon({ slug, name }: { slug?: string; name: string }) {
  if (slug) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${slug}/57534E`}
        alt={name}
        width={16}
        height={16}
      />
    )
  }
  return <span className="tc-fallback">{name[0]}</span>
}

function FeaturedCard({ tool }: { tool: ParsedTool }) {
  const content = (
    <div className="tool-card featured now">
      <div className="tc-featured-icon">
        {tool.simpleIconSlug ? (
          <img
            src={`https://cdn.simpleicons.org/${tool.simpleIconSlug}/ffffff`}
            alt={tool.name}
            width={22}
            height={22}
          />
        ) : (
          <span style={{ color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18 }}>
            {tool.name[0]}
          </span>
        )}
      </div>
      <div className="tc-featured-body">
        <div className="tc-featured-tag">
          {tool.category}{tool.status === 'Active' ? ' · Currently active' : ''}
        </div>
        <div className="tc-featured-name">{tool.name}</div>
        {tool.description && <div className="tc-featured-desc">{tool.description}</div>}
        {tool.notes && <div className="tc-featured-note">{tool.notes}</div>}
      </div>
    </div>
  )

  if (tool.url) {
    return (
      <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        {content}
      </a>
    )
  }
  return content
}

function RegularCard({ tool }: { tool: ParsedTool }) {
  const content = (
    <div className={`tool-card${tool.status === 'Active' ? ' now' : ''}`}>
      <div className="tc-icon">
        <ToolIcon slug={tool.simpleIconSlug} name={tool.name} />
      </div>
      <div className="tc-body">
        {tool.category && <div className="tc-tag">{tool.category}</div>}
        <h2 className="tc-name">{tool.name}</h2>
        {tool.description && <div className="tc-desc">{tool.description}</div>}
        {tool.url && (
          <div className="tc-meta">
            <span className="tc-link">{getDisplayDomain(tool.url)} ↗</span>
          </div>
        )}
      </div>
    </div>
  )

  if (tool.url) {
    return (
      <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        {content}
      </a>
    )
  }
  return content
}

export default function ToolCard({ tool, featured = false }: ToolCardProps) {
  if (featured) {
    return <FeaturedCard tool={tool} />
  }
  return <RegularCard tool={tool} />
}
