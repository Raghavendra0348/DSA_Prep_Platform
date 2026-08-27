import { NavLink, useLocation } from 'react-router-dom';
import { Home, Building2, Search, Layers, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './BottomNav.css';

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const isHomeActive      = path === '/' || path === '/dashboard';
  const isCompaniesActive = path.startsWith('/companies') || path.startsWith('/company');
  const isSearchActive    = path.startsWith('/search');
  const isTopicsActive    = path.startsWith('/topics');
  const isProfileActive   = path.startsWith('/profile') || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/bookmarks');

  return (
    <nav className="bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/"
        className={`bottom-nav-item ${isHomeActive ? 'active' : ''}`}
        aria-label="Home"
      >
        <Home size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/companies"
        className={`bottom-nav-item ${isCompaniesActive ? 'active' : ''}`}
        aria-label="Companies"
      >
        <Building2 size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Companies</span>
      </NavLink>

      <NavLink
        to="/search"
        className={`bottom-nav-item ${isSearchActive ? 'active' : ''}`}
        aria-label="Search"
      >
        <Search size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Search</span>
      </NavLink>

      <NavLink
        to="/topics"
        className={`bottom-nav-item ${isTopicsActive ? 'active' : ''}`}
        aria-label="Topics"
      >
        <Layers size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Topics</span>
      </NavLink>

      <NavLink
        to={user ? '/profile' : '/login'}
        className={`bottom-nav-item ${isProfileActive ? 'active' : ''}`}
        aria-label="Profile"
      >
        <User size={20} className="bottom-nav-icon" />
        <span className="bottom-nav-label">Profile</span>
      </NavLink>
    </nav>
  );
}
