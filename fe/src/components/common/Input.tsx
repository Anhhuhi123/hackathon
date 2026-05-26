import { type InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`input-wrapper ${className}`}>
        {label && <label className="input-label" htmlFor={props.id}>{label}</label>}
        
        <div className="input-container">
          <input
            ref={ref}
            type={inputType}
            className={`input-field ${error ? 'input-error' : ''}`}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        
        {error && (
          <span className="field-error" role="alert">
            <AlertCircle size={14} className="error-icon" />
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
