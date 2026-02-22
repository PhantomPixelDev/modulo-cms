import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface NavigationProps {
  className?: string;
  site?: any;
  menus?: any;
  auth?: {
    user?: {
      id: number;
      name: string;
      email: string;
      roles?: Array<{ id: number; name: string }>;
      permissions?: Array<{ id: number; name: string }>;
    } | null;
  };
}

const Navigation: React.FC<NavigationProps> = ({ className = '', site, menus, auth }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCartCount = async () => {
      try {
        const response = await fetch('/shop/cart/count');
        const data = await response.json();
        if (isMounted && typeof data.count === 'number') {
          setCartCount(data.count);
        }
      } catch (error) {
        // Silently ignore cart count errors
      }
    };

    fetchCartCount();
    const interval = window.setInterval(fetchCartCount, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100/50 py-3' 
          : 'bg-indigo-950/95 backdrop-blur-sm py-5'
      } ${className}`}
    >
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <span className={`text-3xl font-bold transition-all duration-300 ${
                isScrolled 
                  ? 'text-indigo-700' 
                  : 'text-white drop-shadow-lg'
              }`}>
                ModuloCMS
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 transition-all duration-300 ${
                isScrolled ? 'w-0 group-hover:w-full' : 'w-full'
              }`}></div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{t('theme.nav.home', {}, 'Home')}</span>
            </Link>
            <Link 
              href="/shop" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{t('theme.nav.shop', {}, 'Shop')}</span>
            </Link>
            <Link 
              href="/posts" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{t('theme.nav.posts', {}, 'Posts')}</span>
            </Link>
            <Link 
              href="/about" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{t('theme.nav.about', {}, 'About')}</span>
            </Link>
            <Link 
              href="/contact" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">{t('theme.nav.contact', {}, 'Contact')}</span>
            </Link>
            <div className="flex items-center space-x-3 ml-6">
              <Link
                href="/shop/cart"
                className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t('theme.nav.cart', {}, 'Cart')}</span>
                {cartCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-xs font-bold bg-indigo-600 text-white rounded-full w-5 h-5">
                    {cartCount}
                  </span>
                )}
              </Link>
              {auth?.user ? (
                // User is logged in - show dashboard and logout
                <>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isScrolled 
                      ? 'text-gray-600 bg-gray-100' 
                      : 'text-white/80 bg-white/10'
                  }`}>
                    {t('theme.auth.welcome', { name: auth.user.name }, `Welcome, ${auth.user.name}`)}
                  </span>
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t('theme.nav.dashboard', {}, 'Dashboard')}
                  </Link>
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {t('theme.nav.logout', {}, 'Logout')}
                  </Link>
                </>
              ) : (
                // User is not logged in - show login and register
                <>
                  <Link
                    href="/login"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {t('theme.nav.login', {}, 'Login')}
                  </Link>
                  <Link
                    href="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {t('theme.nav.register', {}, 'Register')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className={`p-2 rounded-lg transition-all duration-300 focus:outline-none ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6 transition-transform duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className={`mt-4 p-4 rounded-xl backdrop-blur-md border border-white/10 ${
            isScrolled 
              ? 'bg-white/95 shadow-lg' 
              : 'bg-white/10'
          }`}>
            <div className="space-y-1">
              <Link
                href="/"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('theme.nav.home', {}, 'Home')}
              </Link>
              <Link
                href="/shop"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('theme.nav.shop', {}, 'Shop')}
              </Link>
              <Link
                href="/shop/cart"
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  {t('theme.nav.cart', {}, 'Cart')}
                </span>
                {cartCount > 0 && (
                  <span className="inline-flex items-center justify-center text-xs font-bold bg-indigo-600 text-white rounded-full w-5 h-5">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link
                href="/posts"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('theme.nav.posts', {}, 'Posts')}
              </Link>
              <Link
                href="/about"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('theme.nav.about', {}, 'About')}
              </Link>
              <Link
                href="/contact"
                className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                    : 'text-white hover:bg-white/20'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {t('theme.nav.contact', {}, 'Contact')}
              </Link>
              <div className={`border-t my-3 ${
                isScrolled ? 'border-gray-200' : 'border-white/20'
              }`}></div>
              {auth?.user ? (
                // User is logged in - mobile menu
                <>
                  <div className={`px-4 py-2 text-sm font-medium ${
                    isScrolled ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    {t('theme.auth.welcome', { name: auth.user.name }, `Welcome, ${auth.user.name}`)}
                  </div>
                  <Link
                    href="/dashboard"
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('theme.nav.dashboard', {}, 'Dashboard')}
                  </Link>
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="block w-full text-left px-4 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-medium transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('theme.nav.logout', {}, 'Logout')}
                  </Link>
                </>
              ) : (
                // User is not logged in - mobile menu
                <>
                  <Link
                    href="/login"
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('theme.nav.login', {}, 'Login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-300 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('theme.nav.register', {}, 'Register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
