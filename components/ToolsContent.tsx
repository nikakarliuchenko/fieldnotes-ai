'use client'

import { useState } from 'react'
import FilterBar from './FilterBar'
import ToolCard from './ToolCard'
import type { ParsedTool } from '@/lib/types'

interface ToolsContentProps {
  tools: ParsedTool[]
}

export default function ToolsContent({ tools }: ToolsContentProps) {
  const [activeFilter, setActiveFilter] = useState('All')

  const categories = [...new Set(tools.map((t) => t.category).filter(Boolean))] as string[]
  const filtered = activeFilter === 'All' ? tools : tools.filter((t) => t.category === activeFilter)
  const activeTools = filtered.filter((t) => t.status === 'Active')
  const otherTools = filtered.filter((t) => t.status !== 'Active')

  return (
    <>
      <FilterBar categories={categories} active={activeFilter} onChange={setActiveFilter} />

      {activeTools.length > 0 && (
        <>
          <div className="sec-hd">
            <span>Active stack</span>
            <span className="sec-count">{activeTools.length}</span>
          </div>
          <div className="tools-grid">
            {activeTools.map((tool, i) => (
              <ToolCard key={tool.slug} tool={tool} featured={i === 0} />
            ))}
          </div>
        </>
      )}

      {otherTools.length > 0 && (
        <>
          <div className="sec-hd" style={{ marginTop: 8 }}>
            <span>Also using</span>
            <span className="sec-count">{otherTools.length}</span>
          </div>
          <div className="tools-grid">
            {otherTools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No tools match this filter.</p>
        </div>
      )}
    </>
  )
}
