import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, Search, Hotel } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-primary-500 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <Hotel size={24} />
            <span>MyBooking</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/search" 
              className="text-white hover:text-primary-200 transition-colors"
            >
              Alloggi
            </Link>
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-1 text-white hover:text-primary-200 transition-colors">
                  <span>Ciao, {user?.firstName}</span>
                  <User size={20} />
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                  <Link 
                    to="/account" 
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-500"
                  >
                    Il mio account
                  </Link>
                  {user?.isAdmin && (
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-500"
                    >
                      Amministrazione
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-500"
                  >
                    Esci
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-white hover:text-primary-200 transition-colors"
                >
                  Accedi
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-primary-500 px-4 py-2 rounded-md hover:bg-primary-50 transition-colors"
                >
                  Registrati
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white focus:outline-none" 
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4">
            <Link 
              to="/search" 
              className="block py-2 text-white hover:text-primary-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Alloggi
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/account" 
                  className="block py-2 text-white hover:text-primary-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Il mio account
                </Link>
                {user?.isAdmin && (
                  <Link 
                    to="/admin" 
                    className="block py-2 text-white hover:text-primary-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Amministrazione
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="block py-2 text-white hover:text-primary-200"
                >
                  Esci
                </button>
              </>
            ) : (
              <div className="space-y-2 mt-2">
                <Link 
                  to="/login" 
                  className="block py-2 text-white hover:text-primary-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link 
                  to="/register" 
                  className="block w-full bg-white text-primary-500 px-4 py-2 rounded-md hover:bg-primary-50 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registrati
                </Link>
              </div>
            )}
          </nav>
        )}

        {/* Search Bar on Homepage or Search Page */}
        {(location.pathname === '/' || location.pathname === '/search') && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <label htmlFor="location" className="block text-xs font-medium text-neutral-700 mb-1">
                  Destinazione
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="location"
                    placeholder="Dove vuoi andare?"
                    className="form-input pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                </div>
              </div>
              <div className="flex-1">
                <label htmlFor="check-in" className="block text-xs font-medium text-neutral-700 mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  id="check-in"
                  className="form-input"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="check-out" className="block text-xs font-medium text-neutral-700 mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  id="check-out"
                  className="form-input"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="guests" className="block text-xs font-medium text-neutral-700 mb-1">
                  Ospiti
                </label>
                <select id="guests" className="form-input">
                  <option value="1">1 ospite</option>
                  <option value="2">2 ospiti</option>
                  <option value="3">3 ospiti</option>
                  <option value="4">4 ospiti</option>
                  <option value="5">5 ospiti</option>
                </select>
              </div>
              <div className="flex-none self-end mb-0.5">
                <button 
                  className="btn btn-primary h-10 w-full md:w-auto"
                  onClick={() => navigate('/search')}
                >
                  Cerca
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;