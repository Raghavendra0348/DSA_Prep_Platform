import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  Search,
  Layers,
  User,
  LayoutDashboard,
  Bookmark,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';
import './BottomNav.css';

const PRIMARY_NAV = [
  {
    key: 'home',
    label: 'Home',
    to: '/',
    icon: Home,
    match: (p) => p === '/' || p === '/dashboard',
  },
  {
    key: 'companies',
    label: 'Companies',
    to: '/companies',
    icon: Building2,
    match: (p) => p.startsWith('/companies') || p.startsWith('/company'),
  },
  {
    key: 'search',
    label: 'Search',
    to: '/search',
    icon: Search,
    match: (p) => p.startsWith('/search'),
  },
  {
    key: 'topics',
    label: 'Topics',
    to: '/topics',
    icon: Layers,
    match: (p) => p.startsWith('/topics'),
  },
];

export default function BottomNav() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const menuRef = useRef(null);
  const profileButtonRef = useRef(null);

  // Close menu on route change
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileMenuOpen]);

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
    } else {
      setProfileMenuOpen(prev => !prev);
    }
  };

  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    setLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutModalOpen(false);
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isProfileActive =
    path.startsWith('/profile') ||
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/bookmarks') ||
    profileMenuOpen;

  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="bottom-nav-root">
      {/* ── Background Backdrop for dismiss ────────────────────────────── */}
      {profileMenuOpen && (
        <div
          className="bottom-nav-backdrop"
          onClick={() => setProfileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Profile Popover Menu (Matching Image Design) ───────────────── */}
      {profileMenuOpen && user && (
        <div className="bottom-profile-menu" ref={menuRef} role="menu" aria-label="Profile menu">
          {/* User Header */}
          <div className="profile-menu-header">
            <div className="profile-menu-avatar">
              <span>{userInitial}</span>
            </div>
            <div className="profile-menu-user-info">
              <span className="profile-menu-name">{user.name || 'User'}</span>
              <span className="profile-menu-email">{user.email || ''}</span>
            </div>
          </div>

          <div className="profile-menu-divider" />

          {/* Links */}
          <div className="profile-menu-links">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `profile-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => setProfileMenuOpen(false)}
              role="menuitem"
            >
              <LayoutDashboard size={18} className="profile-menu-icon" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/bookmarks"
              className={({ isActive }) => `profile-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => setProfileMenuOpen(false)}
              role="menuitem"
            >
              <Bookmark size={18} className="profile-menu-icon" />
              <span>Bookmarks</span>
            </NavLink>

            <NavLink
              to="/profile"
              className={({ isActive }) => `profile-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => setProfileMenuOpen(false)}
              role="menuitem"
            >
              <User size={18} className="profile-menu-icon" />
              <span>Profile Settings</span>
            </NavLink>
          </div>

          <div className="profile-menu-divider" />

          {/* Log Out Button */}
          <button
            type="button"
            className="profile-menu-item profile-menu-logout"
            onClick={handleLogoutClick}
            role="menuitem"
          >
            <LogOut size={18} className="profile-menu-icon logout-icon" />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* ── Main Dock Bar ──────────────────────────────────────────────── */}
      <nav className="bottom-nav-container" aria-label="Mobile Navigation">
        <div className="bottom-nav-dock">
          {/* Primary Nav Items */}
          {PRIMARY_NAV.map(({ key, label, to, icon: Icon, match }) => {
            const isActive = match(path);

            return (
              <NavLink
                key={key}
                to={to}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setProfileMenuOpen(false)}
              >
                <div className="bottom-nav-icon-wrap">
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="bottom-nav-icon"
                  />
                  {isActive && <span className="bottom-nav-active-glow" aria-hidden="true" />}
                </div>
                <span className="bottom-nav-label">{label}</span>
              </NavLink>
            );
          })}

          {/* Profile Item (Triggers Popover) */}
          <button
            ref={profileButtonRef}
            type="button"
            className={`bottom-nav-item ${isProfileActive ? 'active' : ''}`}
            aria-label="Profile"
            aria-haspopup="true"
            aria-expanded={profileMenuOpen}
            onClick={handleProfileClick}
          >
            <div className="bottom-nav-icon-wrap">
              <User
                size={21}
                strokeWidth={isProfileActive ? 2.2 : 1.8}
                className="bottom-nav-icon"
              />
              {isProfileActive && <span className="bottom-nav-active-glow" aria-hidden="true" />}
            </div>
            <span className="bottom-nav-label">Profile</span>
          </button>
        </div>
      </nav>

      {/* ── Logout Confirmation Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title=""
        size="sm"
      >
        <div className="logout-dialog">
          <div className="logout-dialog-header">
            <div className="logout-icon-glow">
              <LogOut size={20} />
            </div>
            <div className="logout-dialog-titles">
              <h3 className="logout-dialog-title">Sign out of DSA Prep?</h3>
              <p className="logout-dialog-subtitle">
                You will need to sign back in to access your dashboard and bookmarks.
              </p>
            </div>
          </div>

          {user && (
            <div className="logout-user-preview">
              <div className="logout-user-avatar">
                {userInitial}
              </div>
              <div className="logout-user-details">
                <span className="logout-user-name">{user.name || 'Account'}</span>
                <span className="logout-user-email">{user.email || ''}</span>
              </div>
            </div>
          )}

          <div className="logout-safe-note">
            <CheckCircle2 size={15} />
            <span>All your solved questions and progress are saved in the cloud.</span>
          </div>

          <div className="logout-actions">
            <button
              type="button"
              className="logout-btn-cancel"
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="logout-btn-confirm"
              onClick={confirmLogout}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



