import React from 'react'
import useDashboardStore from '../stores/dashboardStore'
import { Button } from './common/Button'
import { Spinner } from './common/Spinner'

export const BetSlipPanel: React.FC = () => {
  const {
    selectedSelections,
    currentStake,
    currentQuote,
    isCreatingQuote,
    isPlacingBet,
    createQuote,
    placeBet,
  } = useDashboardStore()

  const canQuote = selectedSelections.length > 0 && currentStake > 0

  return (
    <aside className="bet-slip-panel">
      <h3>Bet Slip</h3>
      <div>Selections: {selectedSelections.length}</div>
      <div>Stake: {currentStake}</div>

      {!currentQuote ? (
        <Button disabled={!canQuote || isCreatingQuote} onClick={() => createQuote()}>
          {isCreatingQuote ? <Spinner /> : 'Tạo Quote'}
        </Button>
      ) : (
        <div>
          <div>Quote expires: {currentQuote.expires_at}</div>
          <div>Potential payout: {currentQuote.potential_payout}</div>
          <Button disabled={isPlacingBet} onClick={() => placeBet()}>
            {isPlacingBet ? <Spinner /> : 'Xác nhận đặt cược'}
          </Button>
        </div>
      )}
    </aside>
  )
}

export default BetSlipPanel
