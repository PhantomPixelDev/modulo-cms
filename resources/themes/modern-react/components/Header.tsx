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
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS', tagline: '' };
  const themeColors = theme?.colors || {};
  const primary = themeColors.primary || '#3b82f6';
  const secondary = themeColors.secondary || '#64748b';
  const gradientFrom = themeColors.gradient_from || primary;
  const gradientTo = themeColors.gradient_to || secondary;
  const textPrimary = themeColors.text_primary || '#0f172a';
  const textMuted = themeColors.text_muted || '#94a3b8';
  const borderColor = themeColors.border || 'rgba(255,255,255,0.12)';
  const cardBg = themeColors.card || '#0f172a';
  const buttonText = themeColors.button_text || '#ffffff';

  return (
    <header
      className="backdrop-blur-sm shadow-xl"
      style={{
        background: `linear-gradient(120deg, ${gradientFrom}ee, ${gradientTo}ee)` ,
        borderBottom: `1px solid ${borderColor}`
      }}
    >
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
                  className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl"
                  style={{ background: secondary, color: buttonText }}
                >
                  {(safeSite?.name || 'M').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: buttonText }}>
                  {safeSite?.name || 'Modulo CMS'}
                </h1>
                {safeSite?.tagline && (
                  <p className="text-sm hidden sm:block mt-0.5" style={{ color: `${buttonText}cc` }}>
                    {safeSite.tagline}
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
                className="relative px-5 py-3 font-medium transition-all duration-300 rounded-lg hover:shadow-lg transform hover:scale-105"
                style={{ color: `${buttonText}dd` }}
              >
                <span className="relative z-10">{item.label}</span>
                <div
                  className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundColor: `${buttonText}1a` }}
                ></div>
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-lg transition-all duration-300"
              style={{ color: buttonText, backgroundColor: mobileMenuOpen ? `${buttonText}22` : 'transparent' }}
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
            <div
              className="mt-4 p-4 rounded-xl backdrop-blur-md"
              style={{ backgroundColor: `${cardBg}dd`, border: `1px solid ${borderColor}` }}
            >
              <nav className="flex flex-col space-y-2">
                {menu?.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.target}
                    className="px-4 py-3 text-base font-medium transition-all duration-300 rounded-lg transform hover:scale-105"
                    style={{ color: buttonText, backgroundColor: `${buttonText}14` }}
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
