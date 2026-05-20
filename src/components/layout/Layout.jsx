import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, BookOpen, Plus, ScrollText, LibraryBig, BarChart3, LogOut, Menu, X, Hexagon, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Layout.css';

const menuItems = [
  { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { name: 'Cuentas', icon: <BookOpen size={20} />, path: '/accounts' },
  { name: 'Nueva Partida', icon: <Plus size={20} />, path: '/new-entry', highlight: true },
  { name: 'Libro Diario', icon: <ScrollText size={20} />, path: '/entries' },
  { name: 'Libro Mayor', icon: <LibraryBig size={20} />, path: '/ledger' },
  { name: 'Reportes', icon: <BarChart3 size={20} />, path: '/reports' },
];

const Layout = ({ children }) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'Contador';
  const initial = displayName?.charAt(0)?.toUpperCase() || 'V';
  const currentPage = menuItems.find(i => i.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="app-shell">
      
      {/* Minimal Top Strip */}
      <header className="top-strip">
        <div className="strip-left" onClick={() => navigate('/')}>
          <div className="brand-mark">
            <Hexagon size={22} strokeWidth={2.5} />
          </div>
          <span className="brand-label">VF</span>
        </div>

        <div className="strip-center">
          <span className="current-page-label">{currentPage}</span>
        </div>

        <div className="strip-right">
          <div className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)}>
            <div className="mini-avatar">{initial}</div>
            <ChevronDown size={14} className={`chevron ${profileOpen ? 'open' : ''}`} />
          </div>

          <AnimatePresence>
            {profileOpen && (
              <motion.div 
                className="profile-dropdown"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
              >
                <div className="dropdown-user">
                  <div className="dropdown-avatar">{initial}</div>
                  <div>
                    <strong>{displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-logout" onClick={handleLogout}>
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button className="mobile-hamburger" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Desktop Floating Dock Navigation */}
      <nav className="floating-dock">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `dock-item ${isActive ? 'active' : ''} ${item.highlight ? 'cta' : ''}`}
          >
            <span className="dock-icon">{item.icon}</span>
            <span className="dock-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Fullscreen Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="mobile-nav-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="mobile-nav-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="sheet-handle" />
              <div className="sheet-header">
                <h3>Navegación</h3>
                <button onClick={() => setMobileOpen(false)}><X size={22} /></button>
              </div>
              <div className="sheet-nav">
                {menuItems.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `sheet-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="sheet-link-icon">{item.icon}</span>
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
              <div className="sheet-footer">
                <div className="sheet-user">
                  <div className="dropdown-avatar">{initial}</div>
                  <div>
                    <strong>{displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                </div>
                <button className="sheet-logout" onClick={handleLogout}>
                  <LogOut size={18} /> Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="app-main">
        <div className="app-stage fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="mobile-tab-bar">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''} ${item.highlight ? 'cta' : ''}`}
          >
            <span className="tab-icon">{item.icon}</span>
            <span className="tab-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
};

export default Layout;
