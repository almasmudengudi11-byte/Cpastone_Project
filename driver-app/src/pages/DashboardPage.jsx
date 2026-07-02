import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

function RideRequestCard({ ride, onAccept, accepting }) {
  return (
    <div className="ride-request-card animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="text-xs text-muted">Rider</p>
          <p className="fw-600">{ride.rider?.username || 'Unknown'}</p>
        </div>
        <span className="badge badge-pending">
          <div className="pulse-dot yellow" />
          Pending
        </span>
      </div>

      <div className="ride-route">
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <div>
            <p className="text-xs text-muted">Distance</p>
            <p className="fw-600">{ride.distance} km</p>
          </div>
          <div>
            <p className="text-xs text-muted">Fare</p>
            <p style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '1.1rem' }}>${ride.fare}</p>
          </div>
        </div>
        <button
          id={`btn-accept-${ride._id}`}
          className="btn btn-primary btn-sm"
          onClick={() => onAccept(ride._id)}
          disabled={accepting === ride._id}
        >
          {accepting === ride._id ? <><div className="spinner" /></> : 'Accept'}
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [rides, setRides] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [profRes, ridesRes] = await Promise.all([
        api.get('/drivers/me'),
        api.get('/rides/available'),
      ]);
      setProfile(profRes.data);
      setIsAvailable(profRes.data.isAvailable);
      setRides(ridesRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const socket = getSocket();

    const onNewRide = (ride) => {
      setRides((prev) => {
        if (prev.find((r) => r._id === ride._id)) return prev;
        return [ride, ...prev];
      });
    };
    const onAccepted = ({ rideId }) => {
      setRides((prev) => prev.filter((r) => r._id !== rideId));
    };

    socket.on('ride:new_request', onNewRide);
    socket.on('ride:accepted', onAccepted);

    return () => {
      socket.off('ride:new_request', onNewRide);
      socket.off('ride:accepted', onAccepted);
    };
  }, [fetchData]);

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const { data } = await api.patch('/drivers/availability', { isAvailable: !isAvailable });
      setIsAvailable(data.isAvailable);
    } catch {
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (rideId) => {
    setAccepting(rideId);
    try {
      const { data } = await api.patch(`/rides/${rideId}/accept`);
      navigate('/active', { state: { ride: data } });
    } catch (err) {
      alert(err.response?.data?.error || 'Could not accept ride');
      setAccepting(null);
      fetchData();
    }
  };

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

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Availability toggle */}
        <div className="card animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Status</h3>
            <p className="text-sm text-muted" style={{ marginTop: '0.2rem' }}>
              {isAvailable
                ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>● Online — accepting rides</span>
                : <span style={{ color: 'var(--text-muted)' }}>○ Offline</span>
              }
            </p>
          </div>
          <label className="toggle">
            <input
              id="toggle-availability"
              type="checkbox"
              checked={isAvailable}
              onChange={toggleAvailability}
              disabled={toggling}
            />
            <span className="slider" />
          </label>
        </div>

        {/* Stats */}
        {profile && (
          <div className="stats-grid animate-in">
            <div className="stat-card">
              <p className="stat-value text-accent">{profile.totalRides}</p>
              <p className="stat-label">Total Rides</p>
            </div>
            <div className="stat-card">
              <p className="stat-value" style={{ color: 'var(--warning)' }}>${profile.totalEarnings.toFixed(2)}</p>
              <p className="stat-label">Earnings</p>
            </div>
            <div className="stat-card">
              <p className="stat-value" style={{ color: 'var(--teal)' }}>⭐ {profile.rating.toFixed(1)}</p>
              <p className="stat-label">Rating</p>
            </div>
          </div>
        )}

        {/* Ride requests */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <h2>Available Rides</h2>
            <button id="btn-refresh" className="btn btn-ghost btn-sm" onClick={fetchData}>↻ Refresh</button>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Loading rides…</p>
            </div>
          )}

          {!loading && rides.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '3rem 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '2.5rem' }}>🕐</div>
              <p className="fw-600">No ride requests right now</p>
              <p className="text-sm">Go online and new requests will appear here in real-time.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {rides.map((ride) => (
              <RideRequestCard
                key={ride._id}
                ride={ride}
                onAccept={handleAccept}
                accepting={accepting}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        <button className="bottom-nav-item active" onClick={() => navigate('/dashboard')}>
          <span className="bottom-nav-icon">🏠</span>
          Dashboard
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/earnings')}>
          <span className="bottom-nav-icon">💰</span>
          Earnings
        </button>
      </div>
    </div>
  );
}
