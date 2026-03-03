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
