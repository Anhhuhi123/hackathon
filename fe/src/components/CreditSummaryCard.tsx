import React from 'react'

export const CreditSummaryCard: React.FC<{ wallet: any | null }> = ({ wallet }) => {
  if (!wallet) return null
  return (
    <div className="credit-summary-card">
      <div className="credit-amount">{wallet.available_credit} {wallet.currency_code}</div>
      <div className="credit-meta">Cập nhật: {wallet.updated_at}</div>
    </div>
  )
}

export default CreditSummaryCard
