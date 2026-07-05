import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function EarningsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/rides/driver'), api.get('/drivers/me')])
      .then(([ridesRes, profRes]) => {
        setRides(ridesRes.data);
        setProfile(profRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = rides.filter((r) => r.status === 'completed');
  const todayEarnings = completed
    .filter((r) => {
      const d = new Date(r.completedAt || r.updatedAt);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    })
    .reduce((s, r) => s + r.fare + (r.tip || 0), 0);

  // Get last 7 days of earnings
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  }).map(date => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = date.toDateString();
    
    // Sum earnings (fare + tip) for this date
    const dayCompleted = completed.filter(r => {
      const rd = new Date(r.completedAt || r.updatedAt);
      return rd.toDateString() === formattedDate;
    });
    
    const fares = dayCompleted.reduce((s, r) => s + r.fare, 0);
    const tips = dayCompleted.reduce((s, r) => s + (r.tip || 0), 0);
    const total = fares + tips;
    
    return { dayName, total, fares, tips };
  });

  const maxDailyEarning = Math.max(...last7DaysData.map(d => d.total), 10);

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <nav className="navbar">
        <span className="navbar-brand">🚕 Driver</span>
        <div className="navbar-user">
          <span className="text-sm">{user?.username}</span>
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <button id="btn-logout" className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        <h2>Earnings</h2>

        {/* Summary cards */}
        {profile && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div className="card animate-in" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>
                ${profile.totalEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted" style={{ marginTop: '0.3rem' }}>Total Earnings</p>
            </div>
            <div className="card animate-in" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                ${todayEarnings.toFixed(2)}
              </p>
              <p className="text-xs text-muted" style={{ marginTop: '0.3rem' }}>Today</p>
            </div>
            <div className="card animate-in" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--teal)' }}>
                {profile.totalRides}
              </p>
              <p className="text-xs text-muted" style={{ marginTop: '0.3rem' }}>Total Rides</p>
            </div>
            <div className="card animate-in" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
                ⭐ {profile.rating.toFixed(1)}
              </p>
              <p className="text-xs text-muted" style={{ marginTop: '0.3rem' }}>Rating</p>
            </div>
          </div>
        )}

        {/* SVG Weekly Bar Chart */}
        {!loading && completed.length > 0 && (
          <div className="card animate-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, textAlign: 'left' }}>Weekly Analytics</h3>
            <p className="text-xs text-muted" style={{ margin: 0, textAlign: 'left' }}>Earnings over the last 7 days (including tips)</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, padding: '0 0.5rem', borderBottom: '1px solid var(--border)', marginTop: '0.5rem' }}>
              {last7DaysData.map((day, idx) => {
                const pct = (day.total / maxDailyEarning) * 100;
                const barHeight = Math.max(Math.round(pct), 4);
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12%', gap: '0.3rem' }} title={`$${day.total.toFixed(2)} (Fare: $${day.fares.toFixed(2)}, Tip: $${day.tips.toFixed(2)})`}>
                    <span style={{ fontSize: '0.65rem', color: day.total > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {day.total > 0 ? `$${Math.round(day.total)}` : '$0'}
                    </span>
                    <div style={{
                      width: '100%',
                      height: `${barHeight}px`,
                      background: 'linear-gradient(to top, var(--accent) 0%, var(--warning) 100%)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.5s ease',
                      boxShadow: day.total > 0 ? '0 0 10px rgba(245,158,11,0.2)' : 'none'
                    }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ride history */}
        <div>
          <h3 style={{ marginBottom: '0.875rem', textAlign: 'left' }}>Completed Rides</h3>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Loading…</p>
            </div>
          )}

          {!loading && completed.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '2.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '2.5rem' }}>💰</div>
              <p className="fw-600">No completed rides yet</p>
              <p className="text-sm">Start accepting rides to see your earnings here.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {completed.map((ride) => {
              const date = new Date(ride.completedAt || ride.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });
              const totalAmount = ride.fare + (ride.tip || 0);
              return (
                <div key={ride._id} className="card animate-in" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p className="text-xs text-muted">{date} · <span style={{ color: 'var(--accent-light)' }}>{ride.serviceType || 'Comfort'}</span></p>
                      <p className="fw-600" style={{ marginTop: '0.2rem' }}>
                        {ride.rider?.username || 'Unknown Rider'}
                      </p>
                      <p className="text-sm text-muted">{ride.distance} km · {ride.pickup.address} → {ride.dropoff.address}</p>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '1rem', flexShrink: 0 }}>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)', margin: 0 }}>
                        +${totalAmount.toFixed(2)}
                      </p>
                      {ride.tip > 0 && (
                        <p className="text-xs text-muted" style={{ margin: '0.1rem 0 0', color: 'var(--success)' }}>
                          Incl. ${ride.tip.toFixed(2)} tip
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/dashboard')}>
          <span className="bottom-nav-icon">🏠</span>
          Dashboard
        </button>
        <button className="bottom-nav-item active" onClick={() => navigate('/earnings')}>
          <span className="bottom-nav-icon">💰</span>
          Earnings
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/settings')}>
          <span className="bottom-nav-icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  );
}
