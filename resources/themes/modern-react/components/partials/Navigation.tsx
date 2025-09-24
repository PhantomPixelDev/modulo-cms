import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
  const { auth } = usePage<PageProps>().props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100/50 py-3' 
          : 'bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-purple-900/95 backdrop-blur-sm py-5'
      } ${className}`}
    >
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <span className={`text-3xl font-bold transition-all duration-300 ${
                isScrolled 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600' 
                  : 'text-white drop-shadow-lg'
              }`}>
                ModuloCMS
              </span>
              <div className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
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
              <span className="relative z-10">Home</span>
            </Link>
            <Link 
              href="/posts" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">Posts</span>
            </Link>
            <Link 
              href="/about" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">About</span>
            </Link>
            <Link 
              href="/contact" 
              className={`relative px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                isScrolled 
                  ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="relative z-10">Contact</span>
            </Link>

            {auth.user ? (
              <div className="relative group ml-6">
                <button className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 focus:outline-none ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white/90 hover:bg-white/10'
                }`}>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {auth.user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{auth.user.name}</span>
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 group-hover:rotate-180 ${
                      isScrolled ? 'text-gray-500' : 'text-white/70'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100/50 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <Link
                    href="/dashboard"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-6">
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isScrolled 
                      ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Register
                </Link>
              </div>
            )}
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
                Home
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
                Posts
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
                About
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
                Contact
              </Link>

              {auth.user ? (
                <>
                  <div className={`border-t my-3 ${
                    isScrolled ? 'border-gray-200' : 'border-white/20'
                  }`}></div>
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                    isScrolled ? 'bg-gray-50' : 'bg-white/10'
                  }`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {auth.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium ${
                      isScrolled ? 'text-gray-700' : 'text-white'
                    }`}>{auth.user.name}</span>
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
                    Dashboard
                  </Link>
                  <Link
                    href="/profile"
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className={`block w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-red-300 hover:bg-red-500/20'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Logout
                  </Link>
                </>
              ) : (
                <>
                  <div className={`border-t my-3 ${
                    isScrolled ? 'border-gray-200' : 'border-white/20'
                  }`}></div>
                  <Link
                    href="/login"
                    className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-600' 
                        : 'text-white hover:bg-white/20'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
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
