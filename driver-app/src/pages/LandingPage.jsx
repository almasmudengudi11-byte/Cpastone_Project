import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="page" style={{ overflowY: 'auto', display: 'block', paddingBottom: '4rem' }}>
      {/* ── Navbar ── */}
      <nav className="navbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
        <span className="navbar-brand" style={{ fontSize: '1.4rem', fontWeight: 800 }}>🚗 RideShare</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="http://localhost:5173" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
            Request a Ride
          </a>
          {user ? (
            <Link id="btn-dashboard" to="/dashboard" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <Link id="btn-login-nav" to="/login" className="btn btn-primary btn-sm">
              Login as Driver
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header style={{
        maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center'
      }}>
        {/* Left Side */}
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span style={{
            alignSelf: 'flex-start', padding: '0.4rem 1rem', borderRadius: 99,
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em'
          }}>
            ⚡ NOW LIVE IN YOUR CITY
          </span>
          <h1 style={{ fontSize: '3.6rem', lineHeight: 1.15, background: 'linear-gradient(135deg, #fff 50%, var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your ride,<br />redesigned.
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: 500 }}>
            Experience the next generation of real-time ridesharing. Set your pickup and dropoff, track your driver's route live, and reach your destination seamlessly.
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {user ? (
              <Link id="btn-cta-dashboard" to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: 'var(--radius-md)' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <a href="http://localhost:5173" className="btn btn-ghost" style={{ padding: '1rem 2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  Request a Ride
                </a>
                <Link id="btn-cta-driver" to="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: 'var(--radius-md)' }}>
                  Become a Driver
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Interactive Live Tracking Animation Mockup */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{
            width: '100%', maxWidth: 450, padding: '1.5rem',
            background: 'rgba(13,13,26,0.5)', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), var(--shadow-glow)', borderRadius: 'var(--radius-lg)'
          }}>
            {/* Header of Mock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot purple" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Live Route Tracking</span>
              </div>
              <span className="badge badge-in_progress" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>in progress</span>
            </div>

            {/* Simulated Map with animated vehicle */}
            <div style={{
              height: 220, background: '#090915', borderRadius: 'var(--radius-md)',
              position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {/* Grid Background Overlay */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.15,
                backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />

              {/* Animated Road and Taxi */}
              <svg width="100%" height="100%" viewBox="0 0 500 300" style={{ position: 'absolute', inset: 0 }}>
                {/* Road Line Underlay */}
                <path d="M 50 150 Q 150 50 250 150 T 450 150" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round" />
                {/* Active Route in Blue */}
                <path d="M 50 150 Q 150 50 250 150 T 450 150" fill="none" stroke="#2563eb" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 6" />
                
                {/* Pickup Marker */}
                <circle cx="50" cy="150" r="10" fill="#a78bfa" />
                <circle cx="50" cy="150" r="18" fill="none" stroke="#a78bfa" strokeWidth="2" style={{ animation: 'pulse-ring 2s infinite' }} />
                
                {/* Dropoff Marker */}
                <circle cx="450" cy="150" r="10" fill="#10b981" />
                
                {/* Moving Taxi Marker */}
                <g style={{
                  offsetPath: `path('M 50 150 Q 150 50 250 150 T 450 150')`,
                  offsetRotate: 'auto',
                  animation: 'drive-car 8s infinite linear'
                }}>
                  {/* Taxi Icon Background Circle */}
                  <circle cx="0" cy="0" r="14" fill="#f59e0b" style={{ boxShadow: '0 0 10px rgba(245,158,11,0.5)' }} />
                  <text x="-8" y="5" fontSize="14">🚕</text>
                </g>
              </svg>
            </div>

            {/* Mock ride summary */}
            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-xs text-muted">Distance</p>
                <p className="fw-600" style={{ fontSize: '1rem' }}>4.8 km</p>
              </div>
              <div>
                <p className="text-xs text-muted">Estimated Fare</p>
                <p className="fw-600" style={{ fontSize: '1rem', color: 'var(--accent-light)' }}>$8.26</p>
              </div>
              <div>
                <p className="text-xs text-muted">ETA</p>
                <p className="fw-600" style={{ fontSize: '1rem' }}>6 mins</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem 5rem' }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '3rem', fontSize: '2.2rem' }}>
          Engineered for modern urban transit
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {/* Card 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem' }}>🗺️</div>
            <h3>Dynamic OSRM Routing</h3>
            <p className="text-sm text-secondary">
              No more straight lines. Our map engine calculates the real driving routes step-by-step so you know exactly where your driver is navigating.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem' }}>🔌</div>
            <h3>Real-Time WebSockets</h3>
            <p className="text-sm text-secondary">
              Powered by Socket.io, vehicle location updates and ride state transitions are broadcast instantaneously for a lag-free experience.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <h3>Lucrative Driving Portals</h3>
            <p className="text-sm text-secondary">
              Drivers gain a standalone interface with dynamic request handling, status step updates, and a comprehensive live earnings tracker.
            </p>
          </div>
        </div>
      </section>

      {/* ── Driver CTA banner ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))',
          border: '1px solid rgba(139,92,246,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem',
          padding: '3rem'
        }}>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Want to earn on your own terms?</h2>
            <p className="text-secondary" style={{ maxWidth: 600 }}>
              Become a driver on our network. Manage pending requests on your live dashboard, start and complete rides, and track your metrics.
            </p>
          </div>
          <Link id="btn-cta-driver-bottom" to="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', borderRadius: 'var(--radius-md)', background: '#f59e0b', color: '#000', fontWeight: 800 }}>
            Join as Driver
          </Link>
        </div>
      </section>

      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes drive-car {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
