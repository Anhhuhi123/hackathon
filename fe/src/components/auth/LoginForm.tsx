import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { fetchApi } from '../../lib/apiClient';
import { useAuthStore } from '../../stores/authStore';
import { AlertCircle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Thông tin đăng nhập không chính xác.",
  RATE_LIMIT_EXCEEDED: "Quá nhiều lần thử. Vui lòng thử lại sau.",
  NETWORK_ERROR: "Lỗi kết nối mạng, vui lòng thử lại.",
  DEFAULT: "Đã xảy ra lỗi. Vui lòng thử lại."
};

export const LoginForm: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const navigate = useNavigate();
  const setAccessToken = useAuthStore(state => state.setAccessToken);

  const validate = () => {
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier) errors.identifier = 'Vui lòng nhập email hoặc tên đăng nhập.';
    if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const response = await fetchApi('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, remember_me: rememberMe }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.access_token);
        
        // Handle redirect
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/dashboard';
        navigate(redirect);
      } else {
        const status = response.status;
        let errorMessage = ERROR_MESSAGES.DEFAULT;

        if (status === 401) {
          errorMessage = ERROR_MESSAGES.INVALID_CREDENTIALS;
        } else if (status === 429) {
          errorMessage = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
        } else if (status === 400) {
          const data = await response.json();
          // Assuming the backend sends field errors in `data.errors`
          if (data.errors) {
            setFieldErrors(data.errors);
            errorMessage = ''; // Avoid showing form-level if field-level exists
          } else {
            errorMessage = data.message || ERROR_MESSAGES.DEFAULT;
          }
        }

        if (errorMessage) {
          setFormError(errorMessage);
        }
      }
    } catch (error) {
      setFormError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-header">
        <h1 className="form-title">Chào mừng trở lại</h1>
        <p className="form-subtitle">Đăng nhập vào tài khoản của bạn</p>
      </div>

      {formError && (
        <div className="form-error" role="alert">
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}

      <div className="form-group">
        <Input
          id="identifier"
          label="Email hoặc tên đăng nhập"
          placeholder="Nhập email của bạn"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={fieldErrors.identifier}
          disabled={isLoading}
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <Input
          id="password"
          type="password"
          label="Mật khẩu"
          placeholder="Nhập mật khẩu của bạn"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={isLoading}
          autoComplete="current-password"
        />
      </div>

      <div className="form-actions-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <span className="checkbox-text">Ghi nhớ đăng nhập</span>
        </label>

        <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }} className="forgot-password-link">
          Quên mật khẩu?
        </a>
      </div>

      <Button type="submit" className="w-full mt-4" isLoading={isLoading}>
        Đăng nhập
      </Button>
    </form>
  );
};
