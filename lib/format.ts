import type { Document } from '@contentful/rich-text-types'

export function estimateWordCount(document: Document): number {
  let count = 0
  function walk(node: { content?: Array<{ nodeType: string; value?: string; content?: unknown[] }> }) {
    if (!node.content) return
    for (const child of node.content) {
      if (child.nodeType === 'text' && child.value) {
        count += child.value.trim().split(/\s+/).filter(Boolean).length
      }
      if (child.content) walk(child as typeof node)
    }
  }
  walk(document)
  return count
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatEntryNumber(num: number): string {
  return `#${String(num).padStart(3, '0')}`
}

export function getTagClass(entryType: string): string {
  switch (entryType) {
    case 'Learning':
      return 'learning'
    case 'Building':
      return 'building'
    case 'Testing':
      return 'testing'
    case 'Observing':
    default:
      return 'observing'
  }
}
