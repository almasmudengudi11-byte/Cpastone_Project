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

const RIDE_CATEGORIES = [
  { id: 'Eco', name: 'EcoRide', icon: '🚗', base: 1.5, perKm: 0.8, desc: 'Affordable everyday hatchbacks' },
  { id: 'Comfort', name: 'ComfortRide', icon: '🚘', base: 2.5, perKm: 1.2, desc: 'Newer sedans, top-rated drivers' },
  { id: 'Elite', name: 'EliteRide', icon: '👑', base: 4.5, perKm: 2.0, desc: 'Luxury luxury sedans, ultimate comfort' },
  { id: 'Moto', name: 'MotoRide', icon: '🏍️', base: 1.0, perKm: 0.5, desc: 'Zip through traffic quickly' }
];

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [dropoff, setDropoff] = useState({ address: '', lat: null, lng: null });
  const [pickingMode, setPickingMode] = useState(null); // 'pickup' | 'dropoff' | null
  const [serviceType, setServiceType] = useState('Comfort');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
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

      // Calculate base and perKm based on serviceType
      const category = RIDE_CATEGORIES.find(c => c.id === serviceType) || RIDE_CATEGORIES[1];
      const rawFare = category.base + category.perKm * dist;

      // Calculate discount
      let disc = 0;
      if (appliedPromo) {
        const code = appliedPromo.toUpperCase();
        if (code === 'WELCOME10') {
          disc = rawFare * 0.10;
        } else if (code === 'PREMIUM50' && serviceType === 'Elite') {
          disc = Math.min(rawFare, 5.0);
        } else if (code === 'SAVEMORE') {
          disc = Math.min(rawFare * 0.20, 3.0);
        }
      }
      setDiscount(Math.round(disc * 100) / 100);
      setFare(Math.max(Math.round((rawFare - disc) * 100) / 100, 0.5).toFixed(2));
    } else {
      setFare(null);
      setDistance(null);
      setDiscount(0);
    }
  }, [pickup, dropoff, serviceType, appliedPromo]);

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
      const { data } = await api.post('/rides', {
        pickup,
        dropoff,
        serviceType,
        promoApplied: appliedPromo || null
      });
      navigate('/active', { state: { ride: data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');

    if (!promoCode.trim()) {
      setPromoError('Enter a promo code');
      return;
    }

    const code = promoCode.trim().toUpperCase();
    if (code !== 'WELCOME10' && code !== 'PREMIUM50' && code !== 'SAVEMORE') {
      setPromoError('Invalid promo code');
      return;
    }

    if (code === 'PREMIUM50' && serviceType !== 'Elite') {
      setPromoError('PREMIUM50 is only valid for EliteRide');
      return;
    }

    setAppliedPromo(code);
    setPromoSuccess(`Promo "${code}" applied!`);
  };

  const handleClearPromo = () => {
    setPromoCode('');
    setAppliedPromo('');
    setPromoSuccess('');
    setPromoError('');
    setDiscount(0);
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
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
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

          {/* Ride Category Selector */}
          {distance && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <p className="form-label" style={{ marginBottom: 0 }}>Select Ride Category</p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                {RIDE_CATEGORIES.map((cat) => {
                  const catFare = (cat.base + cat.perKm * parseFloat(distance)).toFixed(2);
                  const isSelected = serviceType === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setServiceType(cat.id);
                        if (appliedPromo === 'PREMIUM50' && cat.id !== 'Elite') {
                          // Clear PREMIUM50 if switching away from Elite
                          setAppliedPromo('');
                          setPromoSuccess('');
                          setPromoError('');
                          setDiscount(0);
                        }
                      }}
                      style={{
                        padding: '0.85rem',
                        background: isSelected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'var(--transition)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem'
                      }}
                      className="category-card"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
                        <span style={{ fontWeight: 800, color: isSelected ? 'var(--accent-light)' : 'var(--text-primary)' }}>
                          ${catFare}
                        </span>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{cat.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.2, margin: 0 }}>{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Promocode Panel */}
          {distance && (
            <div style={{ marginTop: '1rem' }}>
              <p className="form-label" style={{ marginBottom: '0.35rem' }}>Promo Code</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  id="promo-input"
                  className="input"
                  placeholder="e.g. WELCOME10"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={!!appliedPromo}
                  style={{ textTransform: 'uppercase', padding: '0.6rem 0.85rem', fontSize: '0.85rem' }}
                />
                {appliedPromo ? (
                  <button
                    id="btn-clear-promo"
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleClearPromo}
                  >
                    Clear
                  </button>
                ) : (
                  <button
                    id="btn-apply-promo"
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleApplyPromo}
                  >
                    Apply
                  </button>
                )}
              </div>
              {promoError && <p className="text-xs mt-1" style={{ color: 'var(--danger)', margin: '0.2rem 0 0', textAlign: 'left' }}>{promoError}</p>}
              {promoSuccess && <p className="text-xs mt-1" style={{ color: 'var(--success)', margin: '0.2rem 0 0', textAlign: 'left' }}>{promoSuccess}</p>}
              
              {/* Preset Promo hints */}
              {!appliedPromo && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span
                    onClick={() => { setPromoCode('WELCOME10'); setPromoError(''); }}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                  >
                    🎫 WELCOME10 (10% off)
                  </span>
                  <span
                    onClick={() => { setPromoCode('SAVEMORE'); setPromoError(''); }}
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                  >
                    🎫 SAVEMORE (20% off)
                  </span>
                  {serviceType === 'Elite' && (
                    <span
                      onClick={() => { setPromoCode('PREMIUM50'); setPromoError(''); }}
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.04)', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border)' }}
                    >
                      🎫 PREMIUM50 ($5.00 off Elite)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fare estimate and details */}
          {fare && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.5rem',
              padding: '0.875rem 1rem',
              background: 'rgba(139,92,246,0.06)',
              border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 'var(--radius-md)',
              marginTop: '1.25rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-muted">Base Fare ({distance} km)</span>
                <span className="text-sm fw-600">
                  ${(parseFloat(fare) + discount).toFixed(2)}
                </span>
              </div>
              
              {appliedPromo && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-sm text-muted" style={{ color: 'var(--success)' }}>Discount ({appliedPromo})</span>
                  <span className="text-sm fw-600" style={{ color: 'var(--success)' }}>
                    -${discount.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <p className="fw-600" style={{ margin: 0, fontSize: '0.95rem' }}>Total Fare</p>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>All taxes included</p>
                </div>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent-light)', margin: 0 }}>
                  ${fare}
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm" style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{error}</p>}

          <button
            id="btn-request-ride"
            className="btn btn-primary btn-full"
            onClick={handleRequest}
            disabled={loading || !pickup.lat || !dropoff.lat}
            style={{ marginTop: '1rem' }}
          >
            {loading ? <><div className="spinner" /> Requesting…</> : `🚗 Request ${RIDE_CATEGORIES.find(c => c.id === serviceType)?.name || 'Ride'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
