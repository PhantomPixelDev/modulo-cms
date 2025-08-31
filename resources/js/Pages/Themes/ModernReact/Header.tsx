import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  site?: {
    name?: string;
    tagline?: string;
    logo?: string;
  };
  menu?: Array<{
    id: number;
    label: string;
    url: string;
    target: string;
    children?: Array<any>;
  }>;
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export default function Header({ site, menu, theme }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Ensure safe defaults to prevent Object.keys errors
  const safeSite = site || { name: 'Modulo CMS' };
  const safeMenu = menu || [];
  const safeTheme = theme || { colors: { primary: '#3b82f6' } };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              {safeSite?.logo ? (
                <img 
                  src={safeSite.logo} 
                  alt={safeSite.name || 'Logo'} 
                  className="h-8 w-auto"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: safeTheme?.colors?.primary || '#3b82f6' }}
                >
                  {(safeSite?.name || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {safeSite?.name || 'Modulo CMS'}
                </h1>
                {safeSite?.tagline && (
                  <p className="text-sm text-gray-600 hidden sm:block">
                    {safeSite.tagline}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {safeMenu.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.target}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-600 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-gray-900 p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-2">
              {safeMenu.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.target}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-base font-medium transition-colors duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
