import { useState, useEffect, useCallback, useRef } from 'react';
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
const driverIcon = new L.Icon({
  iconUrl: '/marker-icon-2x-yellow.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const STEPS = ['pending', 'accepted', 'in_progress', 'completed'];
const STEP_LABELS = ['Requested', 'Accepted', 'In Progress', 'Completed'];

function StatusStep({ ride }) {
  const idx = STEPS.indexOf(ride.status);
  return (
    <div className="steps" style={{ padding: '0.5rem 0' }}>
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i < idx ? 'done' : i === idx ? 'active' : ''}`}>
          <div className="step-circle">{i < idx ? '✓' : i + 1}</div>
          <span className="step-label">{STEP_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Star Rating Widget ─────────────────────────────────────────────── */
function StarRating({ rideId, onDone }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    const finalTip = showCustomInput ? Number(customTip) || 0 : tip;
    try {
      await api.post(`/rides/${rideId}/rate`, { rating: selected, tip: finalTip });
      setSubmitted(true);
      setTimeout(onDone, 1800);
    } catch {
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  const labels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent!'];

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🙏</div>
        <p style={{ fontWeight: 700, color: 'var(--success)' }}>Thanks for rating!</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.3rem' }}>Rate your driver</p>
      <p className="text-sm text-muted" style={{ marginBottom: '1.25rem' }}>
        How was your experience?
      </p>

      {/* Stars */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            id={`star-${star}`}
            onClick={() => setSelected(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '2.4rem',
              lineHeight: 1,
              transition: 'transform 0.15s',
              transform: (hovered || selected) >= star ? 'scale(1.2)' : 'scale(1)',
              filter: (hovered || selected) >= star ? 'none' : 'grayscale(1) opacity(0.4)',
            }}
          >
            ⭐
          </button>
        ))}
      </div>

      {/* Label */}
      <p style={{
        height: '1.4rem',
        fontWeight: 600,
        color: 'var(--accent-light)',
        fontSize: '0.9rem',
        marginBottom: '1rem',
        transition: 'opacity 0.2s',
        opacity: (hovered || selected) ? 1 : 0,
      }}>
        {labels[hovered || selected]}
      </p>

      {/* Tipping Section */}
      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', textAlign: 'left' }}>Add a Tip for your Driver</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
          {[1, 2, 5].map((amount) => {
            const isSelected = tip === amount && !showCustomInput;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  setTip(amount);
                  setShowCustomInput(false);
                }}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '2px solid var(--success)' : '1px solid var(--border)',
                  color: isSelected ? 'var(--success)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  transition: 'var(--transition)'
                }}
              >
                ${amount}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setTip(0);
              setShowCustomInput(true);
            }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: showCustomInput ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
              border: showCustomInput ? '2px solid var(--success)' : '1px solid var(--border)',
              color: showCustomInput ? 'var(--success)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'var(--transition)'
            }}
          >
            Custom
          </button>
          <button
            type="button"
            onClick={() => {
              setTip(0);
              setShowCustomInput(false);
              setCustomTip('');
            }}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: (tip === 0 && !showCustomInput) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
              border: (tip === 0 && !showCustomInput) ? '1px solid var(--text-secondary)' : '1px solid var(--border)',
              color: (tip === 0 && !showCustomInput) ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'var(--transition)'
            }}
          >
            No Tip
          </button>
        </div>
        
        {showCustomInput && (
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: 140, margin: '0 auto' }}>
            <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>$</span>
            <input
              type="number"
              className="input"
              placeholder="0.00"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          id="btn-skip-rating"
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={onDone}
          disabled={submitting}
        >
          Skip
        </button>
        <button
          id="btn-submit-rating"
          className="btn btn-primary"
          style={{ flex: 2 }}
          onClick={submit}
          disabled={!selected || submitting}
        >
          {submitting ? <><div className="spinner" /> Submitting…</> : 'Submit'}
        </button>
      </div>
    </div>
  );
}

/* ── Accepted Banner ────────────────────────────────────────────────── */
function AcceptedBanner({ driver }) {
  return (
    <div className="animate-in" style={{
      padding: '1rem 1.25rem',
      background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(139,92,246,0.12))',
      border: '1px solid rgba(96,165,250,0.4)',
      borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', gap: '1rem',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
      }}>🧑‍✈️</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, color: '#93c5fd', marginBottom: '0.15rem' }}>Driver is on the way!</p>
        {driver ? (
          <>
            <p className="fw-600" style={{ fontSize: '0.95rem' }}>
              {driver.vehicleInfo?.color} {driver.vehicleInfo?.make} {driver.vehicleInfo?.model}
            </p>
            <p className="text-sm text-muted">Plate: {driver.vehicleInfo?.plate} · ⭐ {driver.rating?.toFixed(1)}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Driver accepted your ride</p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
        <div className="pulse-dot purple" />
        <span className="text-xs text-muted">Live</span>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */
export default function ActiveRidePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [ride, setRide] = useState(state?.ride || null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const rideIdRef = useRef(null);

  // Fetch latest ride status from the server
  const fetchRide = useCallback(async () => {
    try {
      const { data } = await api.get('/rides/my');
      // Find the current ride by ID, or any active ride
      const updated = rideIdRef.current
        ? data.find((r) => r._id === rideIdRef.current)
        : data.find((r) => !['completed', 'cancelled'].includes(r.status));
      if (updated) {
        setRide((prev) => {
          // Trigger rating modal on transition to completed
          if (prev?.status !== 'completed' && updated.status === 'completed') {
            setTimeout(() => setShowRating(true), 800);
          }
          return updated;
        });
        if (['completed', 'cancelled'].includes(updated.status)) {
          // Stop polling when ride is done
          return true;
        }
      }
    } catch {}
    return false;
  }, []);

  // Store ride ID in ref for polling
  useEffect(() => {
    if (ride?._id) rideIdRef.current = ride._id;
  }, [ride?._id]);

  // Poll every 3 seconds as a reliable fallback
  useEffect(() => {
    if (!ride) { navigate('/home'); return; }

    // Immediate fetch on mount to get latest status
    fetchRide();

    const interval = setInterval(async () => {
      const done = await fetchRide();
      if (done) clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket.IO real-time updates (bonus layer on top of polling)
  useEffect(() => {
    if (!ride) return;
    const socket = getSocket();

    const onStatus = (updatedRide) => {
      const sameRide =
        String(updatedRide._id) === String(ride._id);
      if (sameRide) {
        setRide((prev) => {
          if (prev?.status !== 'completed' && updatedRide.status === 'completed') {
            setTimeout(() => setShowRating(true), 800);
          }
          return updatedRide;
        });
        if (updatedRide.status === 'cancelled') {
          setTimeout(() => navigate('/history'), 2000);
        }
      }
    };
    const onDriverLoc = ({ lat, lng }) => setDriverLoc({ lat, lng });

    socket.on('ride:status_update', onStatus);
    socket.on('driver:location_update', onDriverLoc);

    return () => {
      socket.off('ride:status_update', onStatus);
      socket.off('driver:location_update', onDriverLoc);
    };
  }, [ride?._id, navigate]);

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

  const handleCancel = async () => {
    setCancelling(true);
    setConfirmCancel(false);
    try {
      await api.patch(`/rides/${ride._id}/cancel`);
      navigate('/history');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel ride');
      setCancelling(false);
    }
  };

  if (!ride) return null;

  const canCancel = ['pending', 'accepted'].includes(ride.status);
  const mapCenter = [ride.pickup.lat, ride.pickup.lng];

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

      {/* ── Rating Modal overlay ── */}
      {showRating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: 380 }}>
            {/* Ride summary */}
            <div style={{
              textAlign: 'center', padding: '1.25rem 1rem',
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--success)' }}>Ride Completed!</p>
              <p className="text-sm text-muted">
                {ride.distance} km · <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>${ride.fare}</span>
              </p>
            </div>
            <StarRating rideId={ride._id} onDone={() => navigate('/history')} />
          </div>
        </div>
      )}

      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

        {/* Accepted banner */}
        {(ride.status === 'accepted' || ride.status === 'in_progress') && ride.driver && (
          <AcceptedBanner driver={ride.driver} />
        )}

        {/* Map */}
        <div style={{ height: 280 }}>
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <Marker position={[ride.pickup.lat, ride.pickup.lng]} icon={pickupIcon}>
              <Popup>📍 Pickup: {ride.pickup.address}</Popup>
            </Marker>
            <Marker position={[ride.dropoff.lat, ride.dropoff.lng]} icon={dropoffIcon}>
              <Popup>🏁 Dropoff: {ride.dropoff.address}</Popup>
            </Marker>
            {driverLoc && (
              <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon}>
                <Popup>🚕 Your Driver</Popup>
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

        {/* Step tracker */}
        <div className="card animate-in">
          <StatusStep ride={ride} />
        </div>

        {/* Ride details */}
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Ride Details</h2>
            <span className={`badge badge-${ride.status}`}>
              <div className={`pulse-dot ${
                ride.status === 'pending' ? 'yellow' :
                ride.status === 'accepted' ? 'purple' :
                ride.status === 'in_progress' ? 'purple' : 'green'
              }`} />
              {ride.status.replace('_', ' ')}
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

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-xs text-muted">Fare</p>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-light)' }}>${ride.fare}</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
              <p className="text-xs text-muted">Distance</p>
              <p style={{ fontSize: '1.3rem', fontWeight: 800 }}>{ride.distance} km</p>
            </div>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)', fontSize: '0.875rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {canCancel && !confirmCancel && (
            <button
              id="btn-cancel-ride"
              className="btn btn-danger btn-full"
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
            >
              {cancelling ? <><div className="spinner" /> Cancelling…</> : 'Cancel Ride'}
            </button>
          )}

          {canCancel && confirmCancel && (
            <div className="animate-in" style={{
              padding: '1rem',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--danger)', textAlign: 'center' }}>
                ⚠️ Cancel this ride?
              </p>
              <p className="text-sm text-muted" style={{ textAlign: 'center' }}>
                This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  id="btn-confirm-no"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setConfirmCancel(false)}
                >
                  No, Keep Ride
                </button>
                <button
                  id="btn-confirm-yes"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? <><div className="spinner" /> Cancelling…</> : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
