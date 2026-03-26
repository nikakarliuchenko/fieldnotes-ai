interface StatsStripProps {
  sessionCost?: string
  totalTokens?: string
  modelUsed?: string
}

export default function StatsStrip({ sessionCost, totalTokens, modelUsed }: StatsStripProps) {
  if (!sessionCost && !totalTokens && !modelUsed) return null

  return (
    <div className="stats-strip">
      {sessionCost && (
        <div className="stat">
          <span className="stat-val">${sessionCost}</span>
          <span className="stat-lbl">Session cost</span>
        </div>
      )}
      {totalTokens && (
        <div className="stat">
          <span className="stat-val">{totalTokens}</span>
          <span className="stat-lbl">Total tokens</span>
        </div>
      )}
      {modelUsed && (
        <div className="stat">
          <span className="stat-val">{modelUsed}</span>
          <span className="stat-lbl">Model</span>
        </div>
      )}
    </div>
  )
}
