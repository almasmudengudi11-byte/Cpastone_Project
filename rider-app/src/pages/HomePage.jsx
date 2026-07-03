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

// Popular Indian preset locations for quick autocomplete and offline fallback
const PRESET_LOCATIONS = [
  { name: 'Indira Gandhi International Airport (DEL), Delhi', lat: 28.5562, lng: 77.1000, type: 'airport' },
  { name: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177, type: 'landmark' },
  { name: 'India Gate, New Delhi', lat: 28.6129, lng: 77.2295, type: 'landmark' },
  { name: 'Chhatrapati Shivaji Maharaj International Airport (BOM), Mumbai', lat: 19.0896, lng: 72.8656, type: 'airport' },
  { name: 'Gateway of India, Mumbai', lat: 18.9220, lng: 72.8347, type: 'landmark' },
  { name: 'Marine Drive, Mumbai', lat: 18.9436, lng: 72.8231, type: 'landmark' },
  { name: 'Kempegowda International Airport (BLR), Bengaluru', lat: 13.1986, lng: 77.7066, type: 'airport' },
  { name: 'Bangalore Palace, Bengaluru', lat: 12.9984, lng: 77.5920, type: 'landmark' },
  { name: 'Hitech City, Hyderabad', lat: 17.4483, lng: 78.3741, type: 'business' },
  { name: 'Rajiv Gandhi International Airport (HYD), Hyderabad', lat: 17.2403, lng: 78.4294, type: 'airport' },
  { name: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747, type: 'landmark' },
  { name: 'Chennai Central Railway Station, Chennai', lat: 13.0827, lng: 80.2707, type: 'station' },
  { name: 'Marina Beach, Chennai', lat: 13.0475, lng: 80.2824, type: 'landmark' },
  { name: 'Netaji Subhash Chandra Bose International Airport (CCU), Kolkata', lat: 22.6547, lng: 88.4467, type: 'airport' },
  { name: 'Victoria Memorial, Kolkata', lat: 22.5448, lng: 88.3426, type: 'landmark' },
  { name: 'Pune Junction Railway Station, Pune', lat: 18.5289, lng: 73.8739, type: 'station' },
  { name: 'Pune Airport (PNQ), Pune', lat: 18.5822, lng: 73.9197, type: 'airport' },
  { name: 'Lalbagh Botanical Garden, Bengaluru', lat: 12.9507, lng: 77.5844, type: 'landmark' },
  { name: 'Cyber City, Gurugram', lat: 28.4950, lng: 77.0878, type: 'business' },
  { name: 'Sector 62, Noida', lat: 28.6219, lng: 77.3639, type: 'business' },
];

// Helper to determine suggestion list emojis
function getSuggestionIcon(type) {
  switch (type?.toLowerCase()) {
    case 'airport':
      return '✈️';
    case 'station':
    case 'railway':
      return '🚂';
    case 'business':
    case 'office':
    case 'work':
      return '🏢';
    case 'landmark':
    case 'tourist':
      return '🏛️';
    case 'home':
      return '🏠';
    default:
      return '📍';
  }
}

// Nominatim geocode helper
async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'RideShare' } });
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

  // Autocomplete suggestion states
  const [activeSearch, setActiveSearch] = useState(null); // 'pickup' | 'dropoff' | null
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Try to get user's current location and reverse-geocode it to set human-readable address
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCenter([lat, lng]);
        setPickup((p) => ({ ...p, lat, lng }));

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'RideShare' } });
          const data = await res.json();
          if (data && data.display_name) {
            setPickup({
              address: data.display_name,
              lat,
              lng
            });
          }
        } catch (err) {
          console.error('Reverse geocode error:', err);
        }
      },
      () => {}
    );
  }, []);

  // Monitor typing to show debounced autocomplete suggestions
  useEffect(() => {
    const query = activeSearch === 'pickup' ? pickup.address : dropoff.address;
    if (!query || query.trim().length < 2) {
      if (activeSearch) {
        // When focused but short, display popular preset locations for India
        setSuggestions(PRESET_LOCATIONS.slice(0, 5).map(loc => ({ ...loc, isPreset: true })));
      } else {
        setSuggestions([]);
      }
      return;
    }

    // First filter presets client-side for rapid feedback
    const filteredPresets = PRESET_LOCATIONS.filter(loc =>
      loc.name.toLowerCase().includes(query.toLowerCase())
    ).map(loc => ({ ...loc, isPreset: true }));

    setSuggestions(filteredPresets);

    // Call geocoding API after a 400ms debounce
    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'RideShare' } });
        const data = await res.json();
        
        const fetched = data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          type: item.type || 'address',
          isPreset: false
        }));

        setSuggestions(prev => {
          const combined = [...prev];
          fetched.forEach(item => {
            // Avoid duplicate presets or items nearby (less than 10 meters distance)
            const isDuplicate = combined.some(c => 
              c.name.toLowerCase() === item.name.toLowerCase() || 
              (Math.abs(c.lat - item.lat) < 0.0001 && Math.abs(c.lng - item.lng) < 0.0001)
            );
            if (!isDuplicate) {
              combined.push(item);
            }
          });
          return combined.slice(0, 7); // Cap at 7 visible suggestions
        });
      } catch (err) {
        console.error('Geocoding suggestions error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [pickup.address, dropoff.address, activeSearch]);

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

  // Adjust map bounds dynamically to fit both markers when set
  useEffect(() => {
    if (pickup.lat && dropoff.lat && mapRef.current) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng]
      ]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng]);

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
      if (type === 'pickup') {
        setPickup((p) => ({ ...p, ...coords }));
        if (mapRef.current) mapRef.current.setView([coords.lat, coords.lng], 14);
      } else {
        setDropoff((p) => ({ ...p, ...coords }));
        if (mapRef.current) mapRef.current.setView([coords.lat, coords.lng], 14);
      }
    } catch {
      setGeoError(`Could not find: "${addr}"`);
    }
  };

  const handleMapPick = (latlng) => {
    if (pickingMode === 'pickup') setPickup((p) => ({ ...p, lat: latlng.lat, lng: latlng.lng }));
    else if (pickingMode === 'dropoff') setDropoff((p) => ({ ...p, lat: latlng.lat, lng: latlng.lng }));
    setPickingMode(null);
  };

  const handleSelectSuggestion = (suggestion) => {
    if (activeSearch === 'pickup') {
      setPickup({
        address: suggestion.name,
        lat: suggestion.lat,
        lng: suggestion.lng
      });
      if (mapRef.current) mapRef.current.setView([suggestion.lat, suggestion.lng], 14);
    } else if (activeSearch === 'dropoff') {
      setDropoff({
        address: suggestion.name,
        lat: suggestion.lat,
        lng: suggestion.lng
      });
      if (mapRef.current) mapRef.current.setView([suggestion.lat, suggestion.lng], 14);
    }
    setActiveSearch(null);
    setSuggestions([]);
  };

  const handleFocus = (type) => {
    setActiveSearch(type);
    const query = type === 'pickup' ? pickup.address : dropoff.address;
    if (!query || query.trim().length < 2) {
      setSuggestions(PRESET_LOCATIONS.slice(0, 5).map(loc => ({ ...loc, isPreset: true })));
    }
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

      {/* ── Overhauled Home Container with full-bleed Map and floating panel ── */}
      <div className="home-container">
        
        {/* ── Leaflet Map Background ── */}
        <div className="map-wrapper">
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
            {/* Premium Dark Matter Theme Map Tiles */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
                pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }}
              />
            )}
          </MapContainer>
        </div>

        {/* ── Floating Ride Booker Panel ── */}
        <div className="booking-panel card animate-in">
          <h2>Where to?</h2>

          {/* Connected Inputs wrapper */}
          <div className="booking-inputs-container">
            {/* Aesthetic connection connector lines */}
            <div className="location-connector">
              <div className="connector-dot pickup"></div>
              <div className="connector-line"></div>
              <div className="connector-dot dropoff"></div>
            </div>

            <div className="inputs-wrapper">
              
              {/* Pickup Location Group */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="pickup-address">Pickup Location</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="pickup-address"
                    className="input"
                    placeholder="Enter pickup address"
                    value={pickup.address}
                    onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                    onFocus={() => handleFocus('pickup')}
                    onBlur={() => setTimeout(() => { if (activeSearch === 'pickup') setActiveSearch(null); }, 200)}
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

                {/* Pickup Suggestions Dropdown Overlay */}
                {activeSearch === 'pickup' && suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents input onBlur closing lists before selections fire
                          handleSelectSuggestion(sug);
                        }}
                      >
                        <span className="suggestion-icon">{getSuggestionIcon(sug.type)}</span>
                        <div className="suggestion-details">
                          <span className="suggestion-name">{sug.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {pickup.lat && (
                  <span className="text-xs text-muted mt-1" style={{ display: 'block' }}>
                    📍 {pickup.lat.toFixed(5)}, {pickup.lng.toFixed(5)}
                  </span>
                )}
              </div>

              {/* Dropoff Location Group */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="dropoff-address">Dropoff Location</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="dropoff-address"
                    className="input"
                    placeholder="Enter dropoff address"
                    value={dropoff.address}
                    onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                    onFocus={() => handleFocus('dropoff')}
                    onBlur={() => setTimeout(() => { if (activeSearch === 'dropoff') setActiveSearch(null); }, 200)}
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

                {/* Dropoff Suggestions Dropdown Overlay */}
                {activeSearch === 'dropoff' && suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((sug, idx) => (
                      <li
                        key={idx}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectSuggestion(sug);
                        }}
                      >
                        <span className="suggestion-icon">{getSuggestionIcon(sug.type)}</span>
                        <div className="suggestion-details">
                          <span className="suggestion-name">{sug.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {dropoff.lat && (
                  <span className="text-xs text-muted mt-1" style={{ display: 'block' }}>
                    🏁 {dropoff.lat.toFixed(5)}, {dropoff.lng.toFixed(5)}
                  </span>
                )}
              </div>

            </div>
          </div>

          {geoError && <p className="text-sm" style={{ color: 'var(--danger)', marginTop: '0.25rem' }}>{geoError}</p>}

          {/* Fare estimate and Distance details */}
          {fare && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.875rem 1rem',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: 'var(--radius-sm)',
              marginTop: '0.5rem',
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

          {error && <p className="text-sm" style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</p>}

          <button
            id="btn-request-ride"
            className="btn btn-primary btn-full"
            onClick={handleRequest}
            disabled={loading || !pickup.lat || !dropoff.lat}
            style={{ marginTop: '0.75rem' }}
          >
            {loading ? <><div className="spinner" /> Requesting…</> : '🚗 Request Ride'}
          </button>
        </div>
      </div>
    </div>
  );
}
