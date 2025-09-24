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

  return (
    <header className="bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-purple-900/95 backdrop-blur-sm shadow-xl border-b border-white/10">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              {site?.logo ? (
                <img 
                  src={site.logo} 
                  alt={site.name || 'Logo'} 
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div 
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {(site?.name || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg group-hover:text-blue-100 transition-colors duration-300">
                  {site?.name || 'Modulo CMS'}
                </h1>
                {site?.tagline && (
                  <p className="text-sm text-blue-100/80 hidden sm:block mt-0.5">
                    {site.tagline}
                  </p>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-2">
            {menu?.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                target={item.target}
                className="relative px-5 py-3 text-white/90 hover:text-white font-medium transition-all duration-300 rounded-lg hover:bg-white/10 hover:shadow-lg transform hover:scale-105"
              >
                <span className="relative z-10">{item.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:text-blue-100 p-3 rounded-lg hover:bg-white/10 transition-all duration-300"
              aria-label="Toggle menu"
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
          <div className="md:hidden pb-6">
            <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <nav className="flex flex-col space-y-2">
                {menu?.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.target}
                    className="text-white hover:text-blue-100 px-4 py-3 text-base font-medium transition-all duration-300 rounded-lg hover:bg-white/20 transform hover:scale-105"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
