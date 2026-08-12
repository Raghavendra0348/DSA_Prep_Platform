import { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, Check } from 'lucide-react';
import { getMe, updateProfile, changePassword } from '../api/user';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import Skeleton from '../components/ui/Skeleton';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    document.title = 'Profile — DSA Prep';
    async function load() {
      try {
        const data = await getMe();
        const p = data.user || data;
        setProfile(p);
        setEditForm({ name: p.name || '' });
      } catch (err) {
        console.error('Profile load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Profile Edit ───────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) { setEditError('Name is required'); return; }

    setEditLoading(true);
    setEditError('');
    try {
      const data = await updateProfile({ name: editForm.name.trim() });
      const updated = data.user || data;
      setProfile(updated);
      updateUser({ ...user, name: updated.name });
      setEditing(false);
      setEditSuccess('Profile updated');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      setEditError(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Password Change ────────────────────────────────────────────────────
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!pwForm.currentPassword || !pwForm.newPassword) {
      setPwError('All fields are required');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwSuccess('Password changed successfully');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      if (err.code === 'INVALID_PASSWORD') setPwError('Current password is incorrect');
      else setPwError(err.message || 'Password change failed');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page container">
        <Skeleton width={200} height={28} />
        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <Skeleton width={64} height={64} style={{ borderRadius: '50%' }} />
          <Skeleton width="40%" height={20} style={{ marginTop: 16 }} />
          <Skeleton width="30%" height={14} style={{ marginTop: 8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page container">
      <h1>Profile</h1>

      {/* ── Profile Info ───────────────────────────────────────────────────── */}
      <div className="card profile-card">
        <div className="profile-avatar">
          {(profile?.name || 'U').charAt(0).toUpperCase()}
        </div>

        {editing ? (
          <form className="profile-edit-form" onSubmit={handleEditSubmit}>
            {editError && (
              <div className="auth-error">
                <AlertCircle size={16} /> {editError}
              </div>
            )}
            <div className="auth-field">
              <label>Name</label>
              <input
                className="input"
                value={editForm.name}
                onChange={(e) => setEditForm({ name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="profile-edit-actions">
              <button type="submit" className="btn btn-primary btn-sm" disabled={editLoading}>
                {editLoading ? <Spinner size={14} /> : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setEditError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <h2>{profile?.name}</h2>
            <p className="profile-email">{profile?.email}</p>
            {profile?.createdAt && (
              <p className="profile-joined">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
              <User size={14} /> Edit Profile
            </button>
            {editSuccess && (
              <span className="profile-success"><Check size={14} /> {editSuccess}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Change Password ────────────────────────────────────────────────── */}
      <div className="card profile-pw-card">
        <h2><Lock size={18} /> Change Password</h2>

        {pwError && (
          <div className="auth-error">
            <AlertCircle size={16} /> {pwError}
          </div>
        )}
        {pwSuccess && (
          <div className="profile-pw-success">
            <Check size={16} /> {pwSuccess}
          </div>
        )}

        <form className="profile-pw-form" onSubmit={handlePwSubmit}>
          <div className="auth-field">
            <label>Current Password</label>
            <input
              className="input"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              autoComplete="current-password"
            />
          </div>
          <div className="auth-field">
            <label>New Password</label>
            <input
              className="input"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label>Confirm New Password</label>
            <input
              className="input"
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
            {pwLoading ? <Spinner size={14} /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
