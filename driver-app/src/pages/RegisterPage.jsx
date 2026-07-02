import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', password: '', confirm: '',
    make: '', model: '', plate: '', color: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/driver-register', {
        username: form.username,
        password: form.password,
        vehicleInfo: {
          make: form.make || 'Unknown',
          model: form.model || 'Unknown',
          plate: form.plate || 'XXX-000',
          color: form.color || 'White',
        },
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          bottom: '-10%', right: '-5%',
        }} />
      </div>

      <div className="animate-in" style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
            fontSize: '1.8rem', marginBottom: '1rem',
          }}>🚕</div>
          <h1 style={{ marginBottom: '0.4rem' }}>Become a Driver</h1>
          <p className="text-muted text-sm">Register and start earning today</p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">Username</label>
              <input id="reg-username" className="input" placeholder="Choose a username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} minLength={3} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="input" placeholder="At least 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" type="password" className="input" placeholder="Repeat password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Vehicle Information <span className="text-muted fw-600">(optional)</span></p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-make">Make</label>
                <input id="reg-make" className="input" placeholder="Toyota" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-model">Model</label>
                <input id="reg-model" className="input" placeholder="Camry" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-plate">Plate</label>
                <input id="reg-plate" className="input" placeholder="ABC-123" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-color">Color</label>
                <input id="reg-color" className="input" placeholder="White" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>

            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)', fontSize: '0.875rem',
              }}>{error}</div>
            )}

            <button id="btn-register" type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating account…</> : 'Register as Driver'}
            </button>
          </form>

          <div className="divider">or</div>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
