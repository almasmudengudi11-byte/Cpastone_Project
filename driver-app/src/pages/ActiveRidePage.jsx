import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';

const pickupIcon = new L.Icon({
  iconUrl: '/marker-icon-2x-violet.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const dropoffIcon = new L.Icon({
  iconUrl: '/marker-icon-2x-green.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const myIcon = new L.Icon({
  iconUrl: '/marker-icon-2x-gold.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export default function ActiveRidePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ride, setRide] = useState(state?.ride || null);
  const [myLoc, setMyLoc] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const watchIdRef = useRef(null);

  // Watch GPS and broadcast location
  useEffect(() => {
    if (!ride) return;
    const socket = getSocket();

    watchIdRef.current = navigator.geolocation?.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        setMyLoc({ lat, lng });
        // Broadcast to backend (persisted) and directly via socket
        api.patch('/drivers/location', { lat, lng }).catch(() => {});
        socket.emit('driver:location_update', {
          driverId: user?.id,
          lat, lng,
          rideId: ride._id,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation?.clearWatch(watchIdRef.current);
    };
  }, [ride, user]);

  // Listen for cancellation
  useEffect(() => {
    if (!ride) return;
    const socket = getSocket();
    const onCancelled = ({ rideId }) => {
      if (rideId === ride._id) {
        alert('Rider has cancelled this ride.');
        navigate('/dashboard');
      }
    };
    socket.on('ride:cancelled', onCancelled);
    return () => socket.off('ride:cancelled', onCancelled);
  }, [ride, navigate]);

  // Fetch actual driving route from OSRM
  useEffect(() => {
    if (ride?.pickup?.lat && ride?.dropoff?.lat) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${ride.pickup.lng},${ride.pickup.lat};${ride.dropoff.lng},${ride.dropoff.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          }
        } catch (err) {
          console.error('Error fetching route from OSRM:', err);
          // Fallback to straight line
          setRouteCoordinates([[ride.pickup.lat, ride.pickup.lng], [ride.dropoff.lat, ride.dropoff.lng]]);
        }
      };
      fetchRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [ride?.pickup?.lat, ride?.pickup?.lng, ride?.dropoff?.lat, ride?.dropoff?.lng]);

  const updateStatus = useCallback(async (status) => {
    setUpdating(true);
    setError('');
    try {
      const { data } = await api.patch(`/rides/${ride._id}/status`, { status });
      setRide(data);
      if (status === 'completed') {
        setTimeout(() => navigate('/earnings'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  }, [ride, navigate]);

  if (!ride) {
    navigate('/dashboard');
    return null;
  }

  const mapCenter = myLoc
    ? [myLoc.lat, myLoc.lng]
    : [ride.pickup.lat, ride.pickup.lng];

  const completed = ride.status === 'completed';

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      <nav className="navbar">
        <span className="navbar-brand">🚕 Active Ride</span>
        <div className="navbar-user">
          <span className="text-sm">{user?.username}</span>
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
        </div>
      </nav>

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Completion banner */}
        {completed && (
          <div className="animate-in" style={{
            padding: '1rem 1.25rem',
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🎉</span>
            <div>
              <p style={{ fontWeight: 700, color: 'var(--success)' }}>Ride Completed!</p>
              <p className="text-sm text-muted">Earned ${ride.fare} · Redirecting…</p>
            </div>
          </div>
        )}

        {/* Map */}
        <div style={{ height: 300 }}>
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
            <Marker position={[ride.pickup.lat, ride.pickup.lng]} icon={pickupIcon}>
              <Popup>📍 Pickup: {ride.pickup.address}</Popup>
            </Marker>
            <Marker position={[ride.dropoff.lat, ride.dropoff.lng]} icon={dropoffIcon}>
              <Popup>🏁 Dropoff: {ride.dropoff.address}</Popup>
            </Marker>
            {myLoc && (
              <Marker position={[myLoc.lat, myLoc.lng]} icon={myIcon}>
                <Popup>🚕 You</Popup>
              </Marker>
            )}
            {routeCoordinates.length > 0 && (
              <Polyline
                positions={routeCoordinates}
                pathOptions={{ color: '#2563eb', weight: 4 }}
              />
            )}
          </MapContainer>
        </div>

        {/* Ride info */}
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Ride Info</h2>
            <span className={`badge badge-${ride.status}`}>
              {ride.status.replace('_', ' ')}
            </span>
          </div>

          {/* Rider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>👤</span>
            <div>
              <p className="text-xs text-muted">Rider</p>
              <p className="fw-600">{ride.rider?.username || 'Unknown'}</p>
            </div>
          </div>

          {/* Route */}
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

          {/* Stats */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-xs text-muted">Fare</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-light)' }}>${ride.fare}</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-xs text-muted">Distance</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>{ride.distance} km</p>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

          {/* Action buttons */}
          {ride.status === 'accepted' && (
            <button id="btn-start-ride" className="btn btn-teal btn-full" onClick={() => updateStatus('in_progress')} disabled={updating}>
              {updating ? <><div className="spinner" /> Starting…</> : '▶ Start Ride'}
            </button>
          )}
          {ride.status === 'in_progress' && (
            <button id="btn-complete-ride" className="btn btn-primary btn-full" onClick={() => updateStatus('completed')} disabled={updating}>
              {updating ? <><div className="spinner" /> Completing…</> : '✓ Complete Ride'}
            </button>
          )}
          {completed && (
            <button id="btn-go-earnings" className="btn btn-ghost btn-full" onClick={() => navigate('/earnings')}>
              View Earnings
            </button>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/dashboard')}>
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
