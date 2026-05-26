import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Trophy } from 'lucide-react';

export const Login: React.FC = () => {
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="brand-section">
          <div className="logo-placeholder">
            <Trophy size={32} />
          </div>
          <h2 className="brand-name">BETFLUX</h2>
          <p className="brand-tagline">Cổng đặt cược bóng đá mô phỏng Pre-Match</p>
        </div>
        <div className="form-section">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
