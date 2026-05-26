import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const Dashboard: React.FC = () => {
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    setAccessToken(null);
    navigate('/login');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <Button variant="secondary" onClick={handleLogout}>Đăng xuất</Button>
      </header>
      <main className="dashboard-content">
        <p>Chào mừng bạn đã đăng nhập thành công!</p>
      </main>
    </div>
  );
};
