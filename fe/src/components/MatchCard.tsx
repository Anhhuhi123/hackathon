import React from 'react'

export const MatchCard: React.FC<{ match: any }> = ({ match }) => {
  return (
    <div className="match-card">
      <div className="match-title">{match.home_team} vs {match.away_team}</div>
      <div className="match-info">Starts: {match.starts_at}</div>
    </div>
  )
}

export default MatchCard
