import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    make: '',
    model: '',
    plate: '',
    color: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/drivers/me')
      .then(({ data }) => {
        if (data && data.vehicleInfo) {
          setForm({
            make: data.vehicleInfo.make || '',
            model: data.vehicleInfo.model || '',
            plate: data.vehicleInfo.plate || '',
            color: data.vehicleInfo.color || '',
          });
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load driver profile');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await api.patch('/drivers/vehicle', form);
      setSuccess('Vehicle information updated successfully!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save vehicle details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '5rem', overflowY: 'auto' }}>
      <nav className="navbar">
        <span className="navbar-brand" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          🚗 RideShare Driver
        </span>
        <div className="navbar-user">
          <span className="text-sm">{user?.username}</span>
          <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <button id="btn-logout" className="btn btn-ghost btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '1.5rem', maxWidth: 500, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
        <h2 style={{ marginBottom: '1.25rem', textAlign: 'left' }}>Vehicle Settings</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p>Loading profile details…</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="make">Vehicle Make</label>
                <input
                  id="make"
                  name="make"
                  type="text"
                  className="input"
                  placeholder="e.g. Tesla, Toyota, Honda"
                  value={form.make}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="model">Vehicle Model</label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  className="input"
                  placeholder="e.g. Model 3, Prius, Civic"
                  value={form.model}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="plate">License Plate Number</label>
                <input
                  id="plate"
                  name="plate"
                  type="text"
                  className="input"
                  placeholder="e.g. TSLA-01, NY-9988"
                  value={form.plate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="color">Vehicle Color</label>
                <input
                  id="color"
                  name="color"
                  type="text"
                  className="input"
                  placeholder="e.g. Black, White, Red"
                  value={form.color}
                  onChange={handleChange}
                  required
                />
              </div>

              {success && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: 'var(--success)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  {success}
                </div>
              )}

              {error && (
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  {error}
                </div>
              )}

              <button
                id="btn-save-vehicle"
                type="submit"
                className="btn btn-primary btn-full"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                  color: '#000',
                  fontWeight: 800
                }}
              >
                {saving ? 'Saving Details…' : '✓ Save Vehicle Details'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/dashboard')}>
          <span className="bottom-nav-icon">🏠</span>
          Dashboard
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/earnings')}>
          <span className="bottom-nav-icon">💰</span>
          Earnings
        </button>
        <button className="bottom-nav-item active" onClick={() => navigate('/settings')}>
          <span className="bottom-nav-icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  );
}
