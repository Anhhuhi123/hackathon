import React from 'react'
import useDashboardStore from '../stores/dashboardStore'

export const MatchCard: React.FC<{ match: any }> = ({ match }) => {
  const { selectedSelections, toggleSelection } = useDashboardStore()

  // Find 1X2 market
  const market = match.markets?.find((m: any) => m.code === '1X2')

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit' 
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="match-card">
      <div className="match-header">
        <span className="league-badge">{match.league}</span>
        <span className="match-time">{formatDate(match.starts_at)}</span>
      </div>
      <div className="match-teams">
        <div className="team home-team">
          <div className="team-logo-placeholder">{match.home_team.substring(0, 2).toUpperCase()}</div>
          <div className="team-name">{match.home_team}</div>
        </div>
        <div className="vs-divider">
          <span className="vs-label">VS</span>
        </div>
        <div className="team away-team">
          <div className="team-logo-placeholder">{match.away_team.substring(0, 2).toUpperCase()}</div>
          <div className="team-name">{match.away_team}</div>
        </div>
      </div>
      {market && market.selections && (
        <div className="odds-grid">
          {market.selections.map((sel: any) => {
            const isSelected = selectedSelections.some((s: any) => s.id === sel.id)
            const handleSelect = () => {
              toggleSelection({
                id: sel.id,
                name: sel.name,
                odds: sel.odds,
                matchId: match.id,
                homeTeam: match.home_team,
                awayTeam: match.away_team,
                marketName: market.name
              })
            }
            return (
              <button
                key={sel.id}
                type="button"
                className={`odds-btn ${isSelected ? 'selected' : ''}`}
                onClick={handleSelect}
              >
                <span className="outcome-name">{sel.name}</span>
                <span className="outcome-odds">{sel.odds.toFixed(2)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MatchCard
