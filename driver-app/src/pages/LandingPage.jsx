import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeReview, setActiveReview] = useState(0);

  const reviews = [
    {
      name: 'David Miller',
      role: 'ComfortRide Driver',
      avatar: '👨‍✈️',
      rating: 5,
      comment: 'The dashboard makes it simple to manage availability. I love that I can track my stats dynamically and see my tips credited instantly!'
    },
    {
      name: 'Priya Patel',
      role: 'EliteRide Partner',
      avatar: '👩‍✈️',
      rating: 5,
      comment: 'Tipping has boosted my income by 20%. The week-by-week SVG graphs help me plan my shifts around peak hours. Excellent platform.'
    },
    {
      name: 'Sam Wilson',
      role: 'MotoRide Driver',
      avatar: '🏍️',
      rating: 5,
      comment: 'Fast matchups and zero lag. The simulated driving demo is awesome for onboarding. Highly recommend becoming a partner!'
    }
  ];

  const faqs = [
    {
      q: 'How and when do I get paid?',
      a: 'Driver payouts are processed weekly. Fares and tips accumulate directly in your wallet balance, which you can track live in the Earnings tab.'
    },
    {
      q: 'What are the vehicle requirements?',
      a: 'Vehicles must be clean, registered, and run in good condition. Depending on make and model, you will be assigned categories like EcoRide, ComfortRide, or EliteRide.'
    },
    {
      q: 'How does tipping work?',
      a: '100% of rider tips go directly to you. When a passenger submits a tip at the end of a trip, it immediately reflects as a credit in your total earnings stats.'
    },
    {
      q: 'How do I manage my availability?',
      a: 'There are no forced shifts! Simply toggle the Status slider to "Online" on your dashboard when you want to accept rides, and toggle it "Offline" when you are done.'
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
        <span className="navbar-brand" style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-light), var(--accent))' }}>🚕 Driver Portals</span>
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
            ⚡ CHOOSE YOUR OWN SHIFTS
          </span>
          <h1 style={{ fontSize: '3.8rem', lineHeight: 1.1, fontWeight: 900, background: 'linear-gradient(135deg, #fff 50%, var(--accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Drive & Earn.<br />Your schedule.
          </h1>
          <p className="text-secondary" style={{ fontSize: '1.15rem', lineHeight: 1.6, maxWidth: 500 }}>
            Unlock premium earnings. Take control of your daily availability, accept local rides with live map routes, and monitor your stats with modern built-in chart reports.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {user ? (
              <Link id="btn-cta-dashboard" to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)' }}>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link id="btn-cta-driver" to="/login" className="btn btn-primary" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)' }}>
                  Become a Driver
                </Link>
                <a href="http://localhost:5173" className="btn btn-ghost" style={{ padding: '1rem 2.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  Request a Ride
                </a>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>$1,200+</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Average Weekly Earnings</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-light)', margin: 0 }}>100% Tips</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Retained by Partners</p>
            </div>
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', margin: 0 }}>Instant</p>
              <p className="text-xs text-muted" style={{ margin: 0 }}>Availability Control</p>
            </div>
          </div>
        </div>

        {/* Right Side - Interactive Earnings Mockup */}
        <div className="animate-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="card" style={{
            width: '100%', maxWidth: 440, padding: '1.5rem',
            background: 'rgba(13,13,26,0.6)', border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), var(--shadow-glow)', borderRadius: 'var(--radius-lg)'
          }}>
            {/* Header of Mock */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="pulse-dot green" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Earnings Analytics</span>
              </div>
              <span className="badge badge-completed" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>Online</span>
            </div>

            {/* Weekly Earnings SVG Bar Chart Mockup */}
            <div style={{
              height: 200, background: '#090915', borderRadius: 'var(--radius-md)',
              position: 'relative', border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column', padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ textAlign: 'left' }}>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>Weekly Revenue</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-light)', margin: 0 }}>$1,284.50</p>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.5rem', borderRadius: 4, fontSize: '0.65rem', color: 'var(--accent-light)', fontWeight: 700 }}>
                  📈 +12% vs last week
                </div>
              </div>

              {/* Grid Background Overlay */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.1,
                backgroundImage: 'radial-gradient(var(--text-muted) 1px, transparent 1px)',
                backgroundSize: '16px 16px', pointerEvents: 'none'
              }} />

              {/* Bar charts SVG */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, marginTop: '0.5rem', position: 'relative', zIndex: 2 }}>
                {[
                  { d: 'Mon', h: 60, val: 120 },
                  { d: 'Tue', h: 90, val: 180 },
                  { d: 'Wed', h: 110, val: 220 },
                  { d: 'Thu', h: 80, val: 160 },
                  { d: 'Fri', h: 130, val: 260 },
                  { d: 'Sat', h: 140, val: 280 },
                  { d: 'Sun', h: 40, val: 80 }
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '11%' }}>
                    <div style={{
                      width: '100%', height: item.h,
                      background: 'linear-gradient(to top, var(--accent-dark) 0%, var(--accent-light) 100%)',
                      borderRadius: '3px 3px 0 0',
                      boxShadow: '0 0 8px rgba(16,185,129,0.2)'
                    }} />
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{item.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat Cards Grid inside mockup */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <div style={{
                padding: '0.75rem', background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <p className="text-xs text-muted" style={{ margin: 0 }}>Completed Trips</p>
                <p className="fw-600" style={{ fontSize: '1.05rem', color: '#fff', margin: '0.1rem 0 0' }}>52 Rides</p>
              </div>
              <div style={{
                padding: '0.75rem', background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                textAlign: 'left'
              }}>
                <p className="text-xs text-muted" style={{ margin: 0 }}>Satisfaction Score</p>
                <p className="fw-600" style={{ fontSize: '1.05rem', color: 'var(--accent-light)', margin: '0.1rem 0 0' }}>4.95 ★ Rating</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem 2rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '3.5rem', fontSize: '2.5rem', fontWeight: 800 }}>
          Designed for modern driver partners
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>⏱️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Flexible Availability</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Go online and offline with a simple status slider. Drive whenever it suits you, without any fixed schedule requirements.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Category Multipliers</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Earn more depending on your car type. EliteRide offers higher base rates and per-km multipliers for ultimate passenger comfort.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Earnings Analytics</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Monitor your daily and weekly totals using beautiful bar chart graphics directly inside the driver app interface.
            </p>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', textAlign: 'left' }}>
            <div style={{ fontSize: '2.5rem' }}>🗺️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Step navigation</h3>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Dynamic path calculations are rendered directly on the driver map to pick up and drop off riders smoothly.
            </p>
          </div>
        </div>
      </section>

      {/* ── Testimonials Section ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 2rem 5rem', position: 'relative', zIndex: 1 }}>
        <h2 style={{ textBreak: 'normal', textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.4rem', fontWeight: 800 }}>
          Feedback from driver partners
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
          Driver FAQ
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
                  border: isOpen ? '1px solid rgba(16,185,129,0.35)' : '1px solid var(--border)',
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

      {/* ── Passenger CTA banner ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(197,168,128,0.06) 0%, rgba(155,126,86,0.04) 100%)',
          border: '1px solid rgba(197,168,128,0.15)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem',
          padding: '3rem', borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 800 }}>Need to request a ride instead?</h2>
            <p className="text-secondary" style={{ maxWidth: 600, margin: 0 }}>
              Use our rider application to request trips, apply coupon codes, choose vehicle classes, rate your drivers, and add tips seamlessly.
            </p>
          </div>
          <a href="http://localhost:5173" className="btn btn-primary" style={{ padding: '1rem 2.5rem', borderRadius: 'var(--radius-md)', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#000', fontWeight: 800 }}>
            Request a Ride
          </a>
        </div>
      </section>
    </div>
  );
}
