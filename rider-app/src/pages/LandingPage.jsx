import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeReview, setActiveReview] = useState(0);

  const reviews = [
    {
      name: 'Sarah Jenkins',
      role: 'Daily Commuter',
      avatar: '👩',
      rating: 5,
      comment: 'Absolutely love the premium cars! The ride categories make it so easy to book an EcoRide for quick trips or an EliteRide when I want to travel in luxury.'
    },
    {
      name: 'Rohan Sharma',
      role: 'Tech Lead',
      avatar: '👨',
      rating: 5,
      comment: 'The live tracking route updates instantly. Applying promo codes is seamless and has saved me so much. Truly a redesign that is impressive!'
    },
    {
      name: 'Elena Rostova',
      role: 'Travel Blogger',
      avatar: '👱‍♀️',
      rating: 5,
      comment: 'Clean interfaces, super fast matches, and a smooth feedback form where I can directly add tips for drivers. 10/10 experience!'
    }
  ];

  const faqs = [
    {
      q: 'How does the fare calculation work?',
      a: 'Fares are calculated based on your pickup and dropoff points using real OSRM road routes. The pricing depends on the category chosen: EcoRide has a lower per-km charge, while Comfort and Elite categories offer premium cars at standard rates.'
    },
    {
      q: 'Can I apply promocodes to my rides?',
      a: 'Yes! Simply type any valid promocode (like WELCOME10 or SAVEMORE) in the input area on the booking panel before clicking Request Ride to see the discount deducted live.'
    },
    {
      q: 'How do I tip my driver?',
      a: 'After a ride is completed, a rating dialog will automatically prompt you. You can rate the driver out of 5 stars and choose to credit a tip ($1, $2, $5, or custom) directly to their account.'
    },
    {
      q: 'Is my route tracked in real-time?',
      a: 'Absolutely! Our system broadcasts location updates dynamically via WebSockets. You will be able to watch your driver moving step-by-step on the map as they drive to your pickup point.'
    }
  ];

  const handleNextReview = () => {
    setActiveReview((prev) => (prev + 1) % reviews.length);
  };

  const handlePrevReview = () => {
    setActiveReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  return (
    <div className="page" style={{ overflowY: 'auto', display: 'block', paddingBottom: '5rem', position: 'relative' }}>
      {/* Ambient background glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div className="ambient-glow gold" style={{ width: 600, height: 600, top: '5%', left: '-15%' }} />
        <div className="ambient-glow bronze" style={{ width: 500, height: 500, top: '45%', right: '-10%', animationDelay: '-5s' }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="navbar" style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)' }}>
        <span className="navbar-brand" style={{ fontSize: '1.4rem', fontWeight: 800 }}>🚗 RideShare</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontWeight: 600 }}>
            Become a Driver
          </a>
          {user ? (
            <Link id="btn-dashboard" to="/home" className="btn btn-primary btn-sm">
              Dashboard
            </Link>
          ) : (
            <Link id="btn-login-nav" to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header style={{
        maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem 4rem',
        display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '4rem', alignItems: 'center',
        position: 'relative', zIndex: 1
      }}>
        {/* Left Side */}
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
          <span style={{
            alignSelf: 'flex-start', padding: '0.4rem 1rem', borderRadius: 99,
            background: 'rgba(197,168,128,0.1)', border: '1px solid rgba(197,168,128,0.2)',
            color: 'var(--accent-light)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em'
          }}>
            ⚡ NOW LIVE IN YOUR CITY
          </span>
          <h1 style={{ fontSize: '3.8rem', lineHeight: 1.1, fontWeight: 900, background: 'linear-gradient(135deg, #fff 50%, var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your ride,<br />redesigned.
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: 500 }}>
            Experience the next generation of real-time ridesharing. Select categories tailored to your budget, apply instant promo discounts, and watch driver positions move smoothly on custom dark maps.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {user ? (
              <Link id="btn-cta-dashboard" to="/home" className="btn btn-primary" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)' }}>
                Book a Ride Now
              </Link>
            ) : (
              <>
                <Link id="btn-cta-rider" to="/login" className="btn btn-primary" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)' }}>
                  Request a Ride
                </Link>
                <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  Drive & Earn
                </a>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>10k+</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Rides Completed</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', margin: 0 }}>4.9 ★</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Average Rating</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)', margin: 0 }}>4 Classes</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Premium Services</p>
            </div>
          </div>
        </div>

        {/* Right Side - Interactive Route Mockup */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{
            width: '100%', maxWidth: 440, padding: '1.5rem',
            background: 'rgba(13,13,26,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), var(--shadow-glow)', borderRadius: 'var(--radius-lg)'
          }}>
            {/* Header of Mock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot purple" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Live Route Tracking</span>
              </div>
              <span className="badge badge-in_progress" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>in progress</span>
            </div>

            {/* Simulated Map */}
            <div style={{
              height: 220, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)',
              position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.15,
                backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />

              {/* Float floating details on map */}
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(8px)',
                padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-light)'
              }}>
                ⚡ ETA: 4 mins
              </div>

              <svg width="100%" height="100%" viewBox="0 0 500 300" style={{ position: 'absolute', inset: 0 }}>
                <path d="M 50 150 Q 150 50 250 150 T 450 150" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" strokeLinecap="round" />
                <path d="M 50 150 Q 150 50 250 150 T 450 150" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray="8 6" />
                <circle cx="50" cy="150" r="10" fill="var(--accent-light)" />
                <circle cx="50" cy="150" r="18" fill="none" stroke="var(--accent-light)" strokeWidth="2" style={{ animation: 'pulse-ring 2s infinite' }} />
                <circle cx="450" cy="150" r="10" fill="var(--success)" />
                <g style={{
                  offsetPath: `path('M 50 150 Q 150 50 250 150 T 450 150')`,
                  offsetRotate: 'auto',
                  animation: 'drive-car 8s infinite linear'
                }}>
                  <circle cx="0" cy="0" r="14" fill="var(--accent)" style={{ boxShadow: '0 0 10px var(--accent-glow)' }} />
                  <text x="-8" y="5" fontSize="14">🚗</text>
                </g>
              </svg>
            </div>

            {/* Driver Badge floating */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              marginTop: '1rem', textAlign: 'left'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🧑‍✈️</span>
              <div style={{ flex: 1 }}>
                <p className="fw-600" style={{ fontSize: '0.85rem', margin: 0 }}>Driver: Marcus Carter</p>
                <p className="text-xs text-muted" style={{ margin: 0 }}>Black Tesla Model 3 · TSLA-01</p>
              </div>
              <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.8rem' }}>★ 4.9</span>
            </div>

            {/* Mock ride summary */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-xs text-muted">Distance</p>
                <p className="fw-600" style={{ fontSize: '0.95rem', margin: 0 }}>4.8 km</p>
              </div>
              <div>
                <p className="text-xs text-muted">Estimated Fare</p>
                <p className="fw-600" style={{ fontSize: '0.95rem', color: 'var(--accent-light)', margin: 0 }}>$8.26</p>
              </div>
              <div>
                <p className="text-xs text-muted">Service Type</p>
                <p className="fw-600" style={{ fontSize: '0.95rem', color: 'var(--success)', margin: 0 }}>EliteRide 👑</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '3.5rem', fontSize: '2.5rem', fontWeight: 800 }}>
          Engineered for modern urban transit
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Dynamic OSRM Routing</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Say goodbye to straight lines. Our navigation system models physical driving tracks step-by-step for accurate driver ETAs.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>🔌</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Real-Time WebSockets</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Powered by Socket.io, vehicle location coordinate updates and booking states sync instantly without any screen reloads.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>🎫</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Smart Promocode System</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Apply coupons directly on the checkout screen to discount fares. Calculations are processed on both frontend and backend securely.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Seamless Driver Tips</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Optionally tip your drivers on the ratings modal. Tips credit directly to driver balances and sync on their earnings dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem 5rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.4rem', fontWeight: 800 }}>
          What our passengers say
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{
            width: '100%', maxWidth: 650, display: 'flex', flexDirection: 'column', gap: '1.25rem',
            position: 'relative', overflow: 'hidden', padding: '2.5rem 3rem'
          }}>
            {/* Nav Arrows */}
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: 16, zIndex: 10 }}>
              <button onClick={handlePrevReview} style={{ border: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>‹</button>
            </div>
            <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: 16, zIndex: 10 }}>
              <button onClick={handleNextReview} style={{ border: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>›</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <span style={{ fontSize: '3rem' }}>{reviews[activeReview].avatar}</span>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{reviews[activeReview].name}</h4>
                <p className="text-xs text-muted" style={{ margin: 0 }}>{reviews[activeReview].role}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.2rem' }}>
              {Array.from({ length: reviews[activeReview].rating }).map((_, i) => (
                <span key={i} style={{ color: 'var(--warning)', fontSize: '1.1rem' }}>⭐</span>
              ))}
            </div>

            <p style={{ fontSize: '1.05rem', fontStyle: 'italic', lineHeight: 1.6, color: 'var(--text-secondary)', margin: '0 2rem' }}>
              "{reviews[activeReview].comment}"
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 2rem 5rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.4rem', fontWeight: 800 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="card"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                style={{
                  padding: '1.25rem 1.5rem',
                  cursor: 'pointer',
                  border: isOpen ? '1px solid rgba(139,92,246,0.35)' : '1px solid var(--border)',
                  background: isOpen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: isOpen ? 'var(--accent-light)' : '#fff', textAlign: 'left' }}>
                    {faq.q}
                  </span>
                  <span style={{ color: isOpen ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: '1.2rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}>
                    ＋
                  </span>
                </div>
                {isOpen && (
                  <p className="text-sm text-secondary" style={{ marginTop: '0.85rem', textAlign: 'left', lineHeight: 1.6, animation: 'fadeInUp 0.25s ease both', marginBottom: 0 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Driver CTA banner ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(197,168,128,0.06) 0%, rgba(155,126,86,0.04) 100%)',
          border: '1px solid rgba(197,168,128,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem',
          padding: '3rem', borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Want to earn on your own terms?</h2>
            <p className="text-secondary" style={{ maxWidth: 600, margin: 0 }}>
              Become a driver on our network. Manage pending requests on your live dashboard, start and complete rides, and track your weekly metrics with interactive graphs.
            </p>
          </div>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000', fontWeight: 800 }}>
            Join as Driver
          </a>
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
