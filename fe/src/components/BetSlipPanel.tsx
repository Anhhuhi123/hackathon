import React, { useState, useEffect } from 'react'
import useDashboardStore from '../stores/dashboardStore'
import { Button } from './common/Button'
import { Spinner } from './common/Spinner'
import { Trash2, Clock } from 'lucide-react'

export const BetSlipPanel: React.FC = () => {
  const {
    selectedSelections,
    currentStake,
    currentQuote,
    isCreatingQuote,
    isPlacingBet,
    wallet,
    createQuote,
    placeBet,
    toggleSelection,
    setStake,
    clearQuote
  } = useDashboardStore()

  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!currentQuote || !currentQuote.expires_at) {
      setTimeLeft(0)
      return
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(currentQuote.expires_at) - +new Date()
      return difference > 0 ? Math.round(difference / 1000) : 0
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      const seconds = calculateTimeLeft()
      setTimeLeft(seconds)
      if (seconds <= 0) {
        clearInterval(timer)
        clearQuote()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuote, clearQuote])

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    setStake(isNaN(val) ? 0 : val)
  }

  const addQuickStake = (amount: number) => {
    setStake(currentStake + amount)
  }

  const setMaxStake = () => {
    if (wallet) {
      setStake(wallet.available_credit)
    }
  }

  const canQuote = selectedSelections.length > 0 && currentStake > 0
  const accumulatedOdds = selectedSelections.reduce((acc, s) => acc * s.odds, 1)

  return (
    <aside className="bet-slip-panel">
      <div className="betslip-header">
        <h3>Phiếu Cược ({selectedSelections.length})</h3>
        {selectedSelections.length > 0 && (
          <button type="button" className="clear-slip-btn" onClick={() => {
            selectedSelections.forEach(s => toggleSelection(s))
          }}>
            Xóa hết
          </button>
        )}
      </div>

      {selectedSelections.length === 0 ? (
        <div className="betslip-empty">
          <p>Chưa có lựa chọn cược nào</p>
          <span>Nhấp vào tỷ lệ cược của trận đấu để thêm vào đây</span>
        </div>
      ) : (
        <div className="betslip-content">
          <div className="selections-list">
            {selectedSelections.map((sel: any) => (
              <div key={sel.id} className="slip-selection-item">
                <div className="selection-info">
                  <div className="selection-market">{sel.marketName}</div>
                  <div className="selection-outcome">
                    <strong>{sel.name}</strong>
                    <span className="selection-odds">@{sel.odds.toFixed(2)}</span>
                  </div>
                  <div className="selection-match">
                    {sel.homeTeam} vs {sel.awayTeam}
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-sel-btn"
                  onClick={() => toggleSelection(sel)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="slip-summary">
            <div className="summary-row">
              <span>Tổng tỷ lệ cược:</span>
              <strong className="text-highlight">x{accumulatedOdds.toFixed(2)}</strong>
            </div>

            <div className="stake-section">
              <label htmlFor="stake-input" className="stake-label">Tiền cược (PTS):</label>
              <div className="stake-input-container">
                <input
                  id="stake-input"
                  type="number"
                  min="1"
                  value={currentStake || ''}
                  onChange={handleStakeChange}
                  placeholder="Nhập số tiền cược"
                  className="stake-input-field"
                  disabled={!!currentQuote || isCreatingQuote || isPlacingBet}
                />
                <button
                  type="button"
                  onClick={setMaxStake}
                  className="max-stake-btn"
                  disabled={!!currentQuote || isCreatingQuote || isPlacingBet}
                >
                  MAX
                </button>
              </div>
              
              {!currentQuote && (
                <div className="quick-stakes-row">
                  <button type="button" onClick={() => addQuickStake(100)} disabled={isCreatingQuote || isPlacingBet}>+100</button>
                  <button type="button" onClick={() => addQuickStake(500)} disabled={isCreatingQuote || isPlacingBet}>+500</button>
                  <button type="button" onClick={() => addQuickStake(1000)} disabled={isCreatingQuote || isPlacingBet}>+1k</button>
                  <button type="button" onClick={() => setStake(0)} disabled={isCreatingQuote || isPlacingBet}>Xóa</button>
                </div>
              )}
            </div>

            {currentQuote ? (
              <div className="quote-payout-section">
                <div className="quote-timer">
                  <Clock size={14} />
                  <span>Báo giá hết hạn sau: <strong>{timeLeft}s</strong></span>
                </div>
                <div className="payout-row">
                  <span>Tỷ lệ cược chốt:</span>
                  <strong>x{currentQuote.total_odds.toFixed(2)}</strong>
                </div>
                <div className="payout-row">
                  <span>Tiền thắng dự kiến:</span>
                  <span className="potential-payout-val">{currentQuote.potential_payout.toLocaleString()} PTS</span>
                </div>

                <div className="quote-actions">
                  <Button
                    variant="primary"
                    className="w-full flex-grow"
                    disabled={isPlacingBet || timeLeft <= 0}
                    onClick={() => placeBet()}
                  >
                    {isPlacingBet ? <Spinner /> : 'Xác nhận đặt cược'}
                  </Button>
                  <button
                    type="button"
                    className="cancel-quote-btn"
                    onClick={clearQuote}
                    disabled={isPlacingBet}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full mt-4"
                disabled={!canQuote || isCreatingQuote}
                onClick={() => createQuote()}
              >
                {isCreatingQuote ? <Spinner /> : 'Xem trước báo giá'}
              </Button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default BetSlipPanel
