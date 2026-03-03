import type { ParsedTool } from '@/lib/types'

interface ToolCardProps {
  tool: ParsedTool
  showStatus?: boolean
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'Active':
      return 'status-active'
    case 'Testing':
      return 'status-testing'
    case 'Retired':
    default:
      return 'status-retired'
  }
}

export default function ToolCard({ tool, showStatus = false }: ToolCardProps) {
  const content = (
    <div className="tool-card">
      <div className="tool-header">
        <h3 className="tool-name">{tool.name}</h3>
        {showStatus && (
          <span className={`tool-status ${getStatusClass(tool.status)}`}>
            {tool.status}
          </span>
        )}
      </div>
      {tool.description && (
        <p className="tool-description">{tool.description}</p>
      )}
      {tool.category && (
        <span className="tool-category">{tool.category}</span>
      )}

      <style jsx>{`
        .tool-card {
          padding: 16px;
          transition: background-color 0.2s;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .tool-card:hover {
          background-color: var(--paper-aged);
        }

        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }

        .tool-name {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
        }

        .tool-status {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .tool-description {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.78rem;
          color: var(--muted);
          margin: 0 0 auto;
          line-height: 1.5;
        }

        .tool-category {
          font-family: var(--font-mono);
          font-size: 0.52rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-top: 12px;
        }
      `}</style>
    </div>
  )

  if (tool.url) {
    return (
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tool-link"
        style={{ textDecoration: 'none', display: 'block', height: '100%' }}
      >
        {content}
      </a>
    )
  }

  return content
}
