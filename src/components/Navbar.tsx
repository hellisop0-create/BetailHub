import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, PlusCircle, User, LogOut, Menu, X, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Refs for both mobile and desktop profile menus to handle outside clicks
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ur' : 'en');
  };

  // Improved click outside logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideDesktop = profileRef.current && !profileRef.current.contains(target);
      const isOutsideMobile = mobileProfileRef.current && !mobileProfileRef.current.contains(target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          
          {/* 1. MOBILE LEFT SECTION (Profile Picture with Toggle) */}
          <div className="flex items-center lg:hidden z-20" ref={mobileProfileRef}>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)} // Toggles open/close
                  className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                >
                  <img
                    src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-green-700"
                  />
                </button>

                {/* Mobile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in duration-75">
                    <Link 
                      to="/profile" 
                      onClick={() => setIsProfileOpen(false)} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('profile')}
                    </Link>
                    <button
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={login} className="p-2 text-gray-700">
                <User className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* 2. LOGO SECTION (Centered) */}
          <div className="absolute inset-0 flex justify-center items-center lg:static lg:inset-auto lg:justify-start pointer-events-none">
            <Link to="/" className="flex items-center space-x-3 pointer-events-auto">
              <img
                src="https://i.postimg.cc/Cx3wyT7Y/Gemini_Generated_Image_cbcknocbcknocbck_removebg_preview.png"
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
              <span className={cn(
                "text-2xl font-black tracking-tight font-brand bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent hidden sm:block",
                language === 'ur' && "font-urdu text-green-900"
              )}>
                {t('appName')}
              </span>
            </Link>
          </div>

          {/* 3. DESKTOP NAVIGATION (Right side) */}
          <div className="hidden lg:flex lg:items-center lg:ml-auto lg:space-x-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5" />
              <span>{language === 'en' ? 'اردو' : 'English'}</span>
            </button>

            <Link to="/browse" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              {t('categories')}
            </Link>

            <Link to="/admin" className="px-3 py-2 rounded-md text-green-700 font-bold hover:bg-gray-100">
              {t('admin')}
            </Link>

            {user ? (
              <>
                <Link
                  to="/post-ad"
                  className="flex items-center space-x-1 bg-orange-500 text-white px-4 py-2 rounded-full hover:bg-orange-600 shadow-md"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="font-semibold">{t('postAd')}</span>
                </Link>

                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)} // Toggles open/close
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                  >
                    <img
                      src={user.photoURL || 'https://picsum.photos/seed/user/100/100'}
                      alt="User"
                      className="w-8 h-8 rounded-full border-2 border-green-700"
                    />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in duration-75">
                      <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        {t('profile')}
                      </Link>
                      <button
                        onClick={() => { logout(); setIsProfileOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('logout')}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={login} className="bg-green-700 text-white px-6 py-2 rounded-full hover:bg-green-800 shadow-md">
                {t('login')}
              </button>
            )}
          </div>

          {/* 4. MOBILE RIGHT SECTION (Language & Hamburger) */}
          <div className="flex items-center ml-auto space-x-1 lg:hidden z-20">
            <button onClick={toggleLanguage} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
              <Globe className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. MOBILE MAIN MENU DROPDOWN */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-4 px-4 space-y-2">
          <Link to="/browse" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
            {t('categories')}
          </Link>
          <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-green-700 font-bold hover:bg-gray-100 rounded-md">
            {t('admin')}
          </Link>
          {user && (
            <Link to="/post-ad" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 bg-orange-500 text-white rounded-md text-center font-bold">
              {t('postAd')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}