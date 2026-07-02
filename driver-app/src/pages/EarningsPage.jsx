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
    .reduce((s, r) => s + r.fare, 0);

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

        {/* Ride history */}
        <div>
          <h3 style={{ marginBottom: '0.875rem' }}>Completed Rides</h3>

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
              return (
                <div key={ride._id} className="card animate-in" style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p className="text-xs text-muted">{date}</p>
                      <p className="fw-600" style={{ marginTop: '0.2rem' }}>
                        {ride.rider?.username || 'Unknown Rider'}
                      </p>
                      <p className="text-sm text-muted">{ride.distance} km · {ride.pickup.address} → {ride.dropoff.address}</p>
                    </div>
                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                      +${ride.fare}
                    </p>
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
      </div>
    </div>
  );
}
