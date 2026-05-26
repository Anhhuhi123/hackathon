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
import { LogOut, Trophy, History, RefreshCw, LayoutDashboard } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const navigate = useNavigate();

  // logout handler for api client
  useEffect(() => {
    apiClient.setLogoutHandler(() => {
      setAccessToken(null);
      navigate('/login?redirect=/dashboard');
    });
  }, [navigate, setAccessToken]);

  const {
    user,
    wallet,
    featuredMatches,
    matchList,
    betHistory,
    isBootstrapping,
    isLoadingMatches,
    error,
    loadBootstrap,
    loadMatches,
    refreshWallet,
    refreshBetHistory,
  } = useDashboardStore();

  useEffect(() => {
    loadBootstrap();
    refreshBetHistory();
  }, []);

  useEffect(() => {
    loadMatches({ limit: '20', status: 'OPEN' });
  }, [loadMatches]);

  const handleLogout = () => {
    setAccessToken(null);
    navigate('/login');
  };

  const handleRefreshAll = async () => {
    await refreshWallet();
    await refreshBetHistory();
    await loadMatches({ limit: '20', status: 'OPEN' });
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WON':
        return <span className="status-badge won">Thắng</span>;
      case 'LOST':
        return <span className="status-badge lost">Thua</span>;
      case 'CANCELLED':
        return <span className="status-badge cancelled">Đã hủy</span>;
      default:
        return <span className="status-badge placed">Đang chờ</span>;
    }
  };

  return (
    <div className="dashboard-page-wrapper">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="navbar-brand">
          <div className="logo-glow"></div>
          <Trophy className="logo-icon" size={24} />
          <span className="logo-text">BETFLUX</span>
          <span className="demo-tag">MÔ PHỎNG</span>
        </div>
        <div className="navbar-actions">
          {user && (
            <div className="user-profile">
              <div className="avatar">{user.username.substring(0, 1).toUpperCase()}</div>
              <div className="user-info-text">
                <span className="user-name">{user.full_name || user.username}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}
          <button type="button" onClick={handleRefreshAll} className="refresh-btn-generic" title="Làm mới dữ liệu">
            <RefreshCw size={18} />
          </button>
          <Button variant="secondary" className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </header>

      {isBootstrapping ? (
        <div className="full-skeleton-container">
          <Spinner className="skeleton-spinner" />
          <p>Đang đồng bộ dữ liệu thể thao...</p>
        </div>
      ) : (
        <main className="dashboard-grid">
          {/* Main content area */}
          <div className="dashboard-main">
            <ErrorBanner message={error || undefined} />

            {/* Top Info Banner */}
            <div className="dashboard-welcome-banner">
              <div className="welcome-message">
                <h2>Chào mừng trở lại, {user?.username}! ⚽</h2>
                <p>Nền tảng cược bóng đá mô phỏng chất lượng cao, cập nhật tỷ lệ cược pre-match chuẩn xác.</p>
              </div>
              <div className="wallet-card-container">
                <CreditSummaryCard wallet={wallet} onRefresh={refreshWallet} />
              </div>
            </div>

            {/* Matches Feed */}
            <section className="matches-feed-section">
              <div className="section-header-row">
                <div className="section-title">
                  <LayoutDashboard size={20} className="section-icon" />
                  <h3>Trận đấu nổi bật</h3>
                </div>
              </div>
              <div className="featured-matches-grid">
                {featuredMatches.length === 0 ? (
                  <div className="no-matches-fallback">Không có trận đấu nổi bật nào hiện tại</div>
                ) : (
                  featuredMatches.map((m: any) => (
                    <MatchCard key={m.id} match={m} />
                  ))
                )}
              </div>
            </section>

            <section className="matches-feed-section">
              <div className="section-header-row">
                <div className="section-title">
                  <LayoutDashboard size={20} className="section-icon" />
                  <h3>Tất cả trận đấu đang mở cược</h3>
                </div>
              </div>
              <div className="all-matches-grid">
                {isLoadingMatches ? (
                  <div className="loading-grid-fallback">
                    <Spinner />
                    <span>Đang tải danh sách trận đấu...</span>
                  </div>
                ) : matchList.length === 0 ? (
                  <div className="no-matches-fallback">Không có trận đấu nào đang mở cược</div>
                ) : (
                  matchList.map((m: any) => (
                    <MatchCard key={m.id} match={m} />
                  ))
                )}
              </div>
            </section>

            {/* Bet History */}
            <section className="bet-history-section">
              <div className="section-header-row">
                <div className="section-title">
                  <History size={20} className="section-icon" />
                  <h3>Lịch sử đặt cược</h3>
                </div>
              </div>
              <div className="history-table-container">
                {betHistory.length === 0 ? (
                  <div className="empty-history">Bạn chưa thực hiện cược nào. Hãy chọn kèo và đặt cược ngay!</div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Mã cược</th>
                        <th>Thời gian</th>
                        <th>Tiền cược</th>
                        <th>Tỷ lệ</th>
                        <th>Thắng dự kiến</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {betHistory.map((bet: any) => (
                        <tr key={bet.id}>
                          <td className="bet-id-cell" title={bet.id}>#{bet.id.substring(0, 8)}...</td>
                          <td>{formatDate(bet.created_at)}</td>
                          <td>{bet.stake_amount.toLocaleString()} PTS</td>
                          <td>x{bet.total_odds.toFixed(2)}</td>
                          <td className="payout-cell">{bet.potential_payout.toLocaleString()} PTS</td>
                          <td>{getStatusBadge(bet.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Bet Slip */}
          <div className="dashboard-sidebar">
            <BetSlipPanel />
          </div>
        </main>
      )}
    </div>
  );
};

export default Dashboard;
