import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleDarkMode } from '../../store/slices/themeSlice';
import { MoonIcon, SunIcon, LogoutIcon } from '../UI/Icons';
import { useTranslation } from 'react-i18next';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.theme.darkMode);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'pl' : 'en';
    i18n.changeLanguage(nextLng);
    localStorage.setItem('language', nextLng);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) => 
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path) 
        ? "bg-primary-900 text-white dark:bg-primary-600" 
        : "text-primary-100 hover:bg-primary-600 hover:text-white dark:text-muted-text dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  return (
    <nav className="bg-primary-700 dark:bg-card shadow-lg border-b border-transparent dark:border-base-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white text-xl font-bold tracking-wider">WAREHOUSE<span className="text-primary-400">WMS</span></span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className={navLinkClass("/")}>{t('navbar.dashboard')}</Link>
                <Link to="/inventory" className={navLinkClass("/inventory")}>{t('navbar.inventory')}</Link>
                <Link to="/viewer" className={navLinkClass("/viewer")}>{t('navbar.map')}</Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 text-xs font-black text-primary-100 dark:text-muted-text hover:text-white dark:hover:text-primary-500 border border-primary-500/30 dark:border-base-border rounded transition-colors uppercase tracking-tighter"
              >
                {i18n.language === 'en' ? 'PL' : 'EN'}
              </button>

              {/* theme toggle button */}
              <button
                onClick={() => dispatch(toggleDarkMode())}
                className="p-2 text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <SunIcon /> : <MoonIcon />}
              </button>

              {user && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{user.role === 0 ? 'Manager' : 'Worker'}</div>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Logout"
                  >
                    <LogoutIcon />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
