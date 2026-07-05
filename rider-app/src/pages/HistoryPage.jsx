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
  const [expanded, setExpanded] = useState(false);
  const date = new Date(ride.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const time = new Date(ride.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  // Calculate pricing segments dynamically based on multipliers if not saved
  const service = ride.serviceType || 'Comfort';
  const baseFare = service === 'Elite' ? 4.50 : service === 'Comfort' ? 2.50 : service === 'Eco' ? 1.50 : 1.00;
  const multiplier = service === 'Elite' ? 2.00 : service === 'Comfort' ? 1.20 : service === 'Eco' ? 0.80 : 0.50;
  const distanceFare = Math.round((ride.distance * multiplier) * 100) / 100;
  const subtotal = Math.round((baseFare + distanceFare) * 100) / 100;
  const discount = ride.discount || 0;
  const tip = ride.tip || 0;
  const totalPaid = Math.round((ride.fare + tip) * 100) / 100;

  const categoryIcons = {
    Eco: '🚗',
    Comfort: '🚘',
    Elite: '👑',
    Moto: '🏍️'
  };

  return (
    <div 
      className="ride-card animate-in" 
      onClick={() => setExpanded(!expanded)}
      style={{
        cursor: 'pointer',
        border: expanded ? '1px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: expanded ? '0 8px 30px rgba(197, 168, 128, 0.15)' : 'none',
        background: expanded ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
        transition: 'var(--transition)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
        <div>
          <p className="text-xs text-muted">{date} · {time}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem' }}>{categoryIcons[service]}</span>
          <span className={`badge badge-${ride.status}`}>
            {ride.status.replace('_', ' ')}
          </span>
        </div>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: expanded ? '1px solid var(--border)' : 'none', paddingTop: expanded ? '0.75rem' : 0 }}>
        {expanded ? (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>▲ Close Receipt</span>
        ) : (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>▼ Click to view receipt</span>
        )}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="text-sm text-muted">{ride.distance} km</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>${totalPaid}</span>
        </div>
      </div>

      {expanded && (
        <div 
          style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'rgba(0,0,0,0.25)', 
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'fadeInUp 0.25s ease both',
            textAlign: 'left'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking receipt content
        >
          <p style={{ fontWeight: 700, fontSize: '0.9rem', margin: '0 0 0.25rem', borderBottom: '1px dashed var(--border)', paddingBottom: '0.5rem', color: 'var(--accent-light)' }}>
            🧾 BILLING RECEIPT
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span className="text-secondary">Base Fare ({service})</span>
            <span>${baseFare.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span className="text-secondary">Distance Fare ({ride.distance} km)</span>
            <span>${distanceFare.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
            <span className="text-secondary">Ride Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--accent-light)' }}>
              <span>Promo Discount ({ride.promoApplied || 'Coupon'})</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          {tip > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)' }}>
              <span>Driver Tip</span>
              <span>+${tip.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
            <span>Total Paid</span>
            <span style={{ color: 'var(--accent-light)' }}>${totalPaid.toFixed(2)}</span>
          </div>

          {ride.driver && (
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem' }}>🧑‍✈️</span>
              <div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>
                  Driver: {ride.driver.username || 'Marcus'}
                </p>
                {ride.driver.vehicleInfo && (
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {ride.driver.vehicleInfo.color} {ride.driver.vehicleInfo.make} {ride.driver.vehicleInfo.model}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
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
