import React from 'react'

export const Spinner: React.FC = () => (
  <div role="status" aria-live="polite" className="spinner">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#ccc" strokeWidth="4" strokeDasharray="60" strokeLinecap="round"></circle>
    </svg>
  </div>
)

export default Spinner
import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={`spinner ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="spinner-circle"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="spinner-path"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);
