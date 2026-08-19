import { useState, useEffect } from 'react';
import { Lock, AlertCircle, Check, CalendarDays, Mail, ShieldCheck, Sparkles, UserRoundPen } from 'lucide-react';
import { getMe, updateProfile, changePassword } from '../api/user';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/ui/Spinner';
import Skeleton from '../components/ui/Skeleton';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

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
    if (!editForm.name.trim()) {
      setEditError('Name is required');
      toast.error('Name is required');
      return;
    }

    setEditLoading(true);
    setEditError('');
    try {
      const data = await updateProfile({ name: editForm.name.trim() });
      const updated = data.user || data;
      setProfile(updated);
      updateUser({ ...user, name: updated.name });
      setEditing(false);
      setEditSuccess('Profile updated');
      toast.success('Profile updated successfully');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      const msg = err.message || 'Update failed';
      setEditError(msg);
      toast.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Password Change ────────────────────────────────────────────────────
  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError('');

    if (!pwForm.currentPassword || !pwForm.newPassword) {
      const msg = 'All fields are required';
      setPwError(msg);
      toast.error(msg);
      return;
    }
    if (pwForm.newPassword.length < 6) {
      const msg = 'New password must be at least 6 characters';
      setPwError(msg);
      toast.error(msg);
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      const msg = 'Passwords do not match';
      setPwError(msg);
      toast.error(msg);
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
      toast.success('Password changed successfully');
      setTimeout(() => setPwSuccess(''), 3000);
    } catch (err) {
      let msg = err.message || 'Password change failed';
      if (err.code === 'INVALID_PASSWORD' || err.code === 'WRONG_PASSWORD') msg = 'Current password is incorrect';
      setPwError(msg);
      toast.error(msg);
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page container">
        <div className="profile-loading-heading">
          <Skeleton width={116} height={12} />
          <Skeleton width={260} height={38} style={{ marginTop: 12 }} />
          <Skeleton width={360} height={16} style={{ marginTop: 10 }} />
        </div>
        <div className="card profile-loading-card">
          <Skeleton width={64} height={64} style={{ borderRadius: '50%' }} />
          <div className="profile-loading-lines">
            <Skeleton width="45%" height={20} />
            <Skeleton width="30%" height={14} style={{ marginTop: 8 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page container">
      <header className="profile-page-header">
        <span className="profile-eyebrow"><Sparkles size={13} /> Account workspace</span>
        <h1>Profile settings</h1>
        <p>Manage your identity and keep your DSA Prep account secure.</p>
      </header>

      {/* ── Profile Info ───────────────────────────────────────────────────── */}
      <section className="card profile-card">
        <div className="profile-card-orb profile-card-orb-one" aria-hidden="true" />
        <div className="profile-card-orb profile-card-orb-two" aria-hidden="true" />

        <div className="profile-avatar profile-avatar-large">
          {profile?.avatar ? (
            <img src={profile.avatar} alt={`${profile.name || 'User'} avatar`} />
          ) : (
            (profile?.name || 'U').charAt(0).toUpperCase()
          )}
          <span className="profile-online-indicator" title="Account active" />
        </div>

        {editing ? (
          <form className="profile-edit-form" onSubmit={handleEditSubmit}>
            <div className="profile-section-heading">
              <span className="profile-section-icon"><UserRoundPen size={17} /></span>
              <div>
                <h2>Update your profile</h2>
                <p>Choose the name shown across your workspace.</p>
              </div>
            </div>
            {editError && (
              <div className="auth-error">
                <AlertCircle size={16} /> {editError}
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="profile-name">Name</label>
              <input
                id="profile-name"
                className="input"
                value={editForm.name}
                onChange={(e) => setEditForm({ name: e.target.value })}
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
            <div className="profile-info-topline">
              <span className="profile-member-badge"><ShieldCheck size={13} /> Member account</span>
              {editSuccess && (
                <span className="profile-success"><Check size={14} /> {editSuccess}</span>
              )}
            </div>
            <h2>{profile?.name || 'Your profile'}</h2>
            <p className="profile-email">Your personal DSA preparation workspace.</p>

            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-icon"><Mail size={15} /></span>
                <div>
                  <span className="profile-detail-label">Email address</span>
                  <span className="profile-detail-value">{profile?.email || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-icon"><CalendarDays size={15} /></span>
                <div>
                  <span className="profile-detail-label">Member since</span>
                  <span className="profile-detail-value">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <button className="btn btn-ghost profile-edit-button" onClick={() => setEditing(true)}>
              <UserRoundPen size={15} /> Edit profile
            </button>
          </div>
        )}
      </section>

      {/* ── Change Password ────────────────────────────────────────────────── */}
      <section className="card profile-pw-card">
        <div className="profile-section-heading">
          <span className="profile-section-icon profile-section-icon-security"><Lock size={18} /></span>
          <div>
            <h2>Security</h2>
            <p>Use a strong, unique password to protect your account.</p>
          </div>
          <span className="profile-security-status"><ShieldCheck size={15} /> Protected</span>
        </div>

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
            <label htmlFor="profile-current-password">Current Password</label>
            <input
              id="profile-current-password"
              className="input"
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
              autoComplete="current-password"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="profile-new-password">New Password</label>
            <input
              id="profile-new-password"
              className="input"
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="profile-confirm-password">Confirm New Password</label>
            <input
              id="profile-confirm-password"
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
      </section>
    </div>
  );
}
