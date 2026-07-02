import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// Custom marker icons
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

// Nominatim geocode helper
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error('Address not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function MapClickHandler({ onPick, pickingMode }) {
  useMapEvents({
    click(e) {
      if (pickingMode) onPick(e.latlng);
    },
  });
  return null;
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: '', lat: null, lng: null });
  const [pickingMode, setPickingMode] = useState(null); // 'pickup' | 'dropoff' | null
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geoError, setGeoError] = useState('');
  const [center, setCenter] = useState([20.5937, 78.9629]); // India default
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);

  // Try to get user's current location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCenter([lat, lng]);
        setPickup((p) => ({ ...p, lat, lng }));
      },
      () => {}
    );
  }, []);

  // Recalculate fare preview whenever both coords set
  useEffect(() => {
    if (pickup.lat && dropoff.lat) {
      const R = 6371;
      const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
      const dLng = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((pickup.lat * Math.PI) / 180) *
        Math.cos((dropoff.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistance(dist.toFixed(2));
      setFare((2.5 + 1.2 * dist).toFixed(2));
    } else {
      setFare(null);
      setDistance(null);
    }
  }, [pickup, dropoff]);

  // Fetch actual driving route from OSRM
  useEffect(() => {
    if (pickup.lat && dropoff.lat) {
      const fetchRoute = async () => {
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setRouteCoordinates(coords);
          }
        } catch (err) {
          console.error('Error fetching route from OSRM:', err);
          // Fallback to straight line
          setRouteCoordinates([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]);
        }
      };
      fetchRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

  const handleGeocode = async (type) => {
    const addr = type === 'pickup' ? pickup.address : dropoff.address;
    if (!addr.trim()) return;
    setGeoError('');
    try {
      const coords = await geocode(addr);
      if (type === 'pickup') setPickup((p) => ({ ...p, ...coords }));
      else setDropoff((p) => ({ ...p, ...coords }));
    } catch {
      setGeoError(`Could not find: "${addr}"`);
    }
  };

  const handleMapPick = (latlng) => {
    if (pickingMode === 'pickup') setPickup((p) => ({ ...p, lat: latlng.lat, lng: latlng.lng }));
    else if (pickingMode === 'dropoff') setDropoff((p) => ({ ...p, lat: latlng.lat, lng: latlng.lng }));
    setPickingMode(null);
  };

  const handleRequest = async () => {
    if (!pickup.lat || !pickup.address) { setError('Set a pickup location'); return; }
    if (!dropoff.lat || !dropoff.address) { setError('Set a dropoff location'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/rides', { pickup, dropoff });
      navigate('/active', { state: { ride: data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <span className="navbar-brand">🚗 RideShare</span>
        <div className="navbar-user">
          <span className="text-sm">{user?.username}</span>
          <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <button id="btn-logout" className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', padding: '1.25rem', flex: 1 }}>

        {/* ── Map ── */}
        <div style={{ height: 340, position: 'relative' }}>
          {pickingMode && (
            <div style={{
              position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'rgba(139,92,246,0.9)', color: '#fff',
              padding: '0.4rem 1rem', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600,
              backdropFilter: 'blur(8px)', pointerEvents: 'none',
            }}>
              Click on map to set {pickingMode}
            </div>
          )}
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution=""
            />
            <MapClickHandler onPick={handleMapPick} pickingMode={pickingMode} />
            {pickup.lat && (
              <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
                <Popup>📍 Pickup</Popup>
              </Marker>
            )}
            {dropoff.lat && (
              <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
                <Popup>🏁 Dropoff</Popup>
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

        {/* ── Request Form ── */}
        <div className="card animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>Where to?</h2>

          {/* Pickup */}
          <div className="form-group">
            <label className="form-label" htmlFor="pickup-address">Pickup Location</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="pickup-address"
                className="input"
                placeholder="Enter pickup address"
                value={pickup.address}
                onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode('pickup')}
              />
              <button
                id="btn-geocode-pickup"
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => handleGeocode('pickup')}
                title="Search address"
              >🔍</button>
              <button
                id="btn-pick-pickup"
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setPickingMode(pickingMode === 'pickup' ? null : 'pickup')}
                style={{ borderColor: pickingMode === 'pickup' ? 'var(--accent)' : undefined }}
                title="Pick on map"
              >📍</button>
            </div>
            {pickup.lat && (
              <span className="text-xs text-muted">
                {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
              </span>
            )}
          </div>

          {/* Dropoff */}
          <div className="form-group">
            <label className="form-label" htmlFor="dropoff-address">Dropoff Location</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="dropoff-address"
                className="input"
                placeholder="Enter dropoff address"
                value={dropoff.address}
                onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleGeocode('dropoff')}
              />
              <button
                id="btn-geocode-dropoff"
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => handleGeocode('dropoff')}
                title="Search address"
              >🔍</button>
              <button
                id="btn-pick-dropoff"
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setPickingMode(pickingMode === 'dropoff' ? null : 'dropoff')}
                style={{ borderColor: pickingMode === 'dropoff' ? 'var(--success)' : undefined }}
                title="Pick on map"
              >🏁</button>
            </div>
            {dropoff.lat && (
              <span className="text-xs text-muted">
                {dropoff.lat.toFixed(5)}, {dropoff.lng.toFixed(5)}
              </span>
            )}
          </div>

          {geoError && <p className="text-sm" style={{ color: 'var(--danger)' }}>{geoError}</p>}

          {/* Fare estimate */}
          {fare && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.875rem 1rem',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div>
                <p className="text-xs text-muted">Estimated fare</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)' }}>${fare}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="text-xs text-muted">Distance</p>
                <p className="fw-600">{distance} km</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button
            id="btn-request-ride"
            className="btn btn-primary btn-full"
            onClick={handleRequest}
            disabled={loading || !pickup.lat || !dropoff.lat}
          >
            {loading ? <><div className="spinner" /> Requesting…</> : '🚗 Request Ride'}
          </button>
        </div>
      </div>
    </div>
  );
}
