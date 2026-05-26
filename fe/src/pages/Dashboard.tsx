import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import useDashboardStore from '../stores/dashboardStore';
import CreditSummaryCard from '../components/CreditSummaryCard';
import MatchCard from '../components/MatchCard';
import BetSlipPanel from '../components/BetSlipPanel';
import { Spinner } from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import apiClient from '../lib/apiClient';

export const Dashboard: React.FC = () => {
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const navigate = useNavigate();

  // logout handler for api client
  useEffect(() => {
    apiClient.setLogoutHandler(() => {
      setAccessToken(null)
      navigate('/login?redirect=/dashboard')
    })
  }, [navigate, setAccessToken])

  const {
    user,
    wallet,
    featuredMatches,
    matchList,
    isBootstrapping,
    isLoadingMatches,
    error,
    loadBootstrap,
    loadMatches,
  } = useDashboardStore();

  useEffect(() => {
    loadBootstrap()
  }, [])

  useEffect(() => {
    // initial matches
    loadMatches({ limit: '20', status: 'OPEN' })
  }, [loadMatches])

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
        {isBootstrapping ? (
          <div className="full-skeleton"><Spinner /></div>
        ) : (
          <>
            <ErrorBanner message={error || undefined} />
            <section className="hero">
              <CreditSummaryCard wallet={wallet} />
              {user && <div className="welcome">Xin chào, {user.full_name || user.email}</div>}
            </section>

            <section className="matches">
              <h2>Trận đấu nổi bật</h2>
              <div className="match-list">
                {featuredMatches.length === 0 && <div>Không có trận đấu nổi bật</div>}
                {featuredMatches.map((m: any) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </section>

            <section className="match-list-full">
              <h2>Tất cả trận (một phần)</h2>
              {isLoadingMatches ? <Spinner /> : (
                matchList.map((m: any) => <MatchCard key={m.id} match={m} />)
              )}
            </section>

            <BetSlipPanel />
          </>
        )}
      </main>
    </div>
  );
};
