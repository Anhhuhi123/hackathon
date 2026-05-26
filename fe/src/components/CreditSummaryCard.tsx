import React from 'react'
import { Wallet as WalletIcon, RefreshCw } from 'lucide-react'

export const CreditSummaryCard: React.FC<{ wallet: any | null; onRefresh?: () => void }> = ({ wallet, onRefresh }) => {
  if (!wallet) return null

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="credit-summary-card">
      <div className="card-bg-gradient"></div>
      <div className="card-header-row">
        <div className="card-title">
          <WalletIcon size={18} className="card-icon" />
          <span>Số Dư Khả Dụng</span>
        </div>
        {onRefresh && (
          <button type="button" onClick={onRefresh} className="refresh-wallet-btn" title="Cập nhật số dư">
            <RefreshCw size={16} />
          </button>
        )}
      </div>
      <div className="credit-balance">
        <span className="balance-value">{wallet.available_credit.toLocaleString()}</span>
        <span className="balance-currency">{wallet.currency_code}</span>
      </div>
      <div className="credit-meta">
        <span>Cập nhật lúc: {formatDate(wallet.updated_at)}</span>
      </div>
    </div>
  )
}

export default CreditSummaryCard
