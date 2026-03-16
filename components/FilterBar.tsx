'use client'

interface FilterBarProps {
  categories: string[]
  active: string
  onChange: (category: string) => void
}

export default function FilterBar({ categories, active, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter tools by category">
      <button
        className={`filter-btn${active === 'All' ? ' on' : ''}`}
        aria-pressed={active === 'All'}
        onClick={() => onChange('All')}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`filter-btn${active === cat ? ' on' : ''}`}
          aria-pressed={active === cat}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
