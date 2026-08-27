import { useState, useEffect } from 'react';
import { Lock, AlertCircle, Check, CalendarDays, Mail, ShieldCheck, Sparkles, UserRoundPen } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/ui/Spinner';
import Skeleton from '../components/ui/Skeleton';
import './Profile.css';

export default function Profile() {
  const { toast } = useToast();

  // ── TanStack Query hook ──────────────────────────────────────────────────
  const {
    profile,
    loading,
    updateProfile,
    updatePending,
    updateError: _updateErrorMsg,
    changePassword,
    passwordPending,
    passwordError: _passwordErrorMsg,
  } = useProfile();

  // ── Local UI state ───────────────────────────────────────────────────────
  const [editing,     setEditing]     = useState(false);
  const [editForm,    setEditForm]    = useState({ name: '' });
  const [editError,   setEditError]   = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  const [pwForm,     setPwForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError,    setPwError]    = useState('');
  const [pwSuccess,  setPwSuccess]  = useState('');

  useEffect(() => {
    document.title = 'Profile — DSA Prep';
  }, []);

  // Seed edit form once profile loads
  useEffect(() => {
    if (profile?.name) setEditForm({ name: profile.name });
  }, [profile?.name]);

  // ── Profile Edit ──────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError('Name is required');
      toast.error('Name is required');
      return;
    }

    setEditError('');
    try {
      await updateProfile({ name: editForm.name.trim() });
      setEditing(false);
      setEditSuccess('Profile updated');
      toast.success('Profile updated successfully');
      setTimeout(() => setEditSuccess(''), 3000);
    } catch (err) {
      const msg = err.message || 'Update failed';
      setEditError(msg);
      toast.error(msg);
    }
  };

  // ── Password Change ───────────────────────────────────────────────────────
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
      if (err.code === 'INVALID_PASSWORD' || err.code === 'WRONG_PASSWORD')
        msg = 'Current password is incorrect';
      setPwError(msg);
      toast.error(msg);
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
              <button type="submit" className="btn btn-primary btn-sm" disabled={updatePending}>
                {updatePending ? <Spinner size={14} /> : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setEditing(false); setEditError(''); }}
              >
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
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                      : '—'}
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

      {/* ── Connected Accounts ─────────────────────────────────────────────── */}
      <section className="card profile-connected-card">
        <div className="profile-section-heading">
          <span className="profile-section-icon profile-section-icon-security"><ShieldCheck size={18} /></span>
          <div>
            <h2>Connected Accounts</h2>
            <p>Authentication methods linked to your DSA Prep account.</p>
          </div>
        </div>

        <div className="profile-connected-list">
          <div className="profile-connected-item">
            <div className="profile-connected-meta">
              <span className="profile-connected-icon"><Mail size={16} /></span>
              <div>
                <strong>Email & Password</strong>
                <span>{profile?.authProvider === 'google' ? 'No password set' : profile?.email}</span>
              </div>
            </div>
            <span className={`profile-badge ${profile?.authProvider === 'google' ? 'profile-badge-inactive' : 'profile-badge-active'}`}>
              {profile?.authProvider === 'google' ? 'Not enabled' : 'Active'}
            </span>
          </div>

          <div className="profile-connected-item">
            <div className="profile-connected-meta">
              <span className="profile-connected-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </span>
              <div>
                <strong>Google Account</strong>
                <span>{profile?.authProvider === 'google' || profile?.authProvider === 'both' ? 'Linked for one-click login' : 'Not linked'}</span>
              </div>
            </div>
            <span className={`profile-badge ${profile?.authProvider === 'google' || profile?.authProvider === 'both' ? 'profile-badge-active' : 'profile-badge-inactive'}`}>
              {profile?.authProvider === 'google' || profile?.authProvider === 'both' ? 'Linked' : 'Not linked'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Change Password (only for accounts with password) ────────────────── */}
      {profile?.authProvider !== 'google' ? (
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
            <button type="submit" className="btn btn-primary btn-sm" disabled={passwordPending}>
              {passwordPending ? <Spinner size={14} /> : 'Update Password'}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
