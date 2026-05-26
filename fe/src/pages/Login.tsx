import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export const Login: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="brand-section">
          <div className="logo-placeholder">
            <div className="logo-icon"></div>
          </div>
          <h2 className="brand-name">Hệ thống Quản lý</h2>
          <p className="brand-tagline">Nền tảng vận hành tối ưu cho doanh nghiệp</p>
        </div>
        <div className="form-section">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
