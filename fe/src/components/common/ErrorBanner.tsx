import React from 'react'

export const ErrorBanner: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null
  return (
    <div role="alert" className="error-banner" aria-live="assertive">
      <strong>Đã xảy ra lỗi:</strong> {message}
    </div>
  )
}

export default ErrorBanner
