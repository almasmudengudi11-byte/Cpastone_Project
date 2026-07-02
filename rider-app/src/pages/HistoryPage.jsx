import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  pending: 'Searching for driver…',
  accepted: 'Driver is on the way',
  in_progress: 'En route to destination',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function RideHistoryCard({ ride }) {
  const date = new Date(ride.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const time = new Date(ride.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="ride-card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div>
          <p className="text-xs text-muted">{date} · {time}</p>
        </div>
        <span className={`badge badge-${ride.status}`}>
          {ride.status.replace('_', ' ')}
        </span>
      </div>

      <div className="ride-route" style={{ marginBottom: '0.875rem' }}>
        <div style={{ position: 'relative' }}>
          <div className="route-dot" style={{ top: 4 }} />
          <p className="route-label">Pickup</p>
          <p className="route-address">{ride.pickup.address}</p>
        </div>
        <div style={{ position: 'relative', marginTop: '0.75rem' }}>
          <div className="route-dot end" style={{ bottom: 'auto', top: 4 }} />
          <p className="route-label">Dropoff</p>
          <p className="route-address">{ride.dropoff.address}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <span className="text-sm text-muted">{ride.distance} km</span>
        <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>${ride.fare}</span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rides/my')
      .then(({ data }) => setRides(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = rides.find((r) => !['completed', 'cancelled'].includes(r.status));

  return (
    <div className="page">
      <nav className="navbar">
        <span className="navbar-brand">🚗 RideShare</span>
        <div className="navbar-user">
          <span className="text-sm">{user?.username}</span>
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <button id="btn-logout" className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '1.25rem', flex: 1 }}>

        {/* Action bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2>Ride History</h2>
          <button
            id="btn-new-ride"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/home')}
          >
            + New Ride
          </button>
        </div>

        {/* Active ride banner */}
        {active && (
          <div
            onClick={() => navigate('/active', { state: { ride: active } })}
            style={{
              cursor: 'pointer',
              padding: '1rem 1.25rem',
              background: 'rgba(139,92,246,0.12)',
              border: '1px solid rgba(139,92,246,0.35)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
            }}
          >
            <div className="pulse-dot purple" />
            <div style={{ flex: 1 }}>
              <p className="fw-600">Active Ride</p>
              <p className="text-sm text-muted">{STATUS_LABELS[active.status]}</p>
            </div>
            <span style={{ color: 'var(--accent-light)', fontSize: '1.1rem' }}>→</span>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', paddingTop: '3rem', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading rides…</p>
          </div>
        )}

        {!loading && rides.length === 0 && (
          <div style={{
            textAlign: 'center', paddingTop: '4rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ fontSize: '3rem' }}>🚗</div>
            <h3>No rides yet</h3>
            <p className="text-muted text-sm">Your ride history will appear here.</p>
            <button id="btn-book-first" className="btn btn-primary" onClick={() => navigate('/home')}>
              Book your first ride
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {rides
            .filter((r) => ['completed', 'cancelled'].includes(r.status))
            .map((ride) => (
              <RideHistoryCard key={ride._id} ride={ride} />
            ))}
        </div>
      </div>
    </div>
  );
}
