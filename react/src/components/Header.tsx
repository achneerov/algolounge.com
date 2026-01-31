import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { Sun, Moon, Menu, User, LogOut, ChevronDown } from 'lucide-react';
import './Header.css';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { activeTheme, toggleTheme } = useTheme();
  const { toggle: toggleSidebar, isVisible: sidebarVisible } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isQuestionsPage = location.pathname.startsWith('/questions/');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {isQuestionsPage && (
            <button
              className="btn btn-icon sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <Link to="/" className="logo">
            <span className="logo-text">AlgoLounge</span>
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/courses" className="nav-link">Courses</Link>
        </nav>

        <div className="header-right">
          <button
            className="btn btn-icon theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {activeTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAuthenticated ? (
            <div className="user-menu-container" ref={menuRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <span className="user-name">{user?.username}</span>
                <ChevronDown size={16} className={`chevron ${showUserMenu ? 'open' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <span className="user-email">{user?.email}</span>
                  </div>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth/sign-in" className="btn btn-ghost">Sign In</Link>
              <Link to="/auth/sign-up" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
