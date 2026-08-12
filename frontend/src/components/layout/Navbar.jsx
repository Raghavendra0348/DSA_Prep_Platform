import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Code2, Menu, X, LayoutDashboard, Bookmark, User, LogOut } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <Code2 size={24} />
          <span>DSA Prep</span>
        </Link>

        {/* Desktop nav links */}
        <div id="navbar-links" className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/companies" className="nav-link" onClick={() => setMenuOpen(false)}>
            Companies
          </NavLink>
          <NavLink to="/topics" className="nav-link" onClick={() => setMenuOpen(false)}>
            Topics
          </NavLink>
          <NavLink to="/search" className="nav-link" onClick={() => setMenuOpen(false)}>
            Search
          </NavLink>

          {/* Mobile-only auth links */}
          {user ? (
            <div className="mobile-auth-links">
              <NavLink to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink to="/bookmarks" className="nav-link" onClick={() => setMenuOpen(false)}>
                Bookmarks
              </NavLink>
              <NavLink to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                Profile
              </NavLink>
              <button className="nav-link logout-link" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="mobile-auth-links">
              <NavLink to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
              <NavLink to="/register" className="nav-link btn-primary" onClick={() => setMenuOpen(false)}>
                Register
              </NavLink>
            </div>
          )}
        </div>

        {/* Desktop auth area */}
        <div className="navbar-auth">
          {user ? (
            <div className="user-menu">
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="user-avatar" aria-hidden="true">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name">{user.name}</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} />
                  <div className="user-dropdown">
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link to="/bookmarks" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <Bookmark size={16} /> Bookmarks
                    </Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <User size={16} /> Profile
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="navbar-links"
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
    </nav>
  );
}
