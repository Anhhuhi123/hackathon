import React, { type ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled, 
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} ${className}`} 
      disabled={isLoading || disabled} 
      {...props}
    >
      {isLoading && <Spinner className="btn-spinner" />}
      <span className={isLoading ? 'btn-content-loading' : ''}>{children}</span>
    </button>
  );
};
