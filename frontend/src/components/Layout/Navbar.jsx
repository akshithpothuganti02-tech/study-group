import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Navbar — top navigation bar with links and user logout.
 */
const Navbar = () => {
  const { user, userAttributes, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/groups', label: 'Browse Groups' },
    { to: '/groups/create', label: 'Create Group' },
    { to: '/profile', label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">📚</span> StudySync
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-blue-200 ${
                  isActive(link.to) ? 'text-white border-b-2 border-white pb-0.5' : 'text-blue-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-sm text-blue-100">
              {userAttributes?.email || user?.username}
            </span>
            <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
              Sign Out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-blue-800 px-4 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block text-blue-100 hover:text-white py-2 text-sm"
            >
              {link.label}
            </Link>
          ))}
          <button onClick={handleLogout} className="w-full text-left text-blue-100 hover:text-white py-2 text-sm">
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
