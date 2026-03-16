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
