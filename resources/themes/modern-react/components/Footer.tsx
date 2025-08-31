import React from 'react';
import { Link } from '@inertiajs/react';

interface FooterProps {
  site?: {
    name?: string;
    tagline?: string;
  };
  menu?: Array<{
    id: number;
    label: string;
    url: string;
    target: string;
  }>;
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export default function Footer({ site, menu, theme }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: theme?.colors?.primary || '#3b82f6' }}
              >
                {(site?.name || 'M').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {site?.name || 'Modulo CMS'}
              </h3>
            </div>
            {site?.tagline && (
              <p className="text-gray-600 mb-4 max-w-md">
                {site.tagline}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Built with Modulo CMS - A modern, flexible content management system.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <nav className="space-y-2">
              {menu?.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.target}
                  className="block text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact/Social Column */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Connect
            </h4>
            <div className="space-y-2">
              <a 
                href="mailto:hello@example.com" 
                className="block text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Contact Us
              </a>
              <a 
                href="/privacy" 
                className="block text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="block text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {currentYear} {site?.name || 'Modulo CMS'}. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2 md:mt-0">
              Powered by{' '}
              <a 
                href="https://github.com/PhantomPixelDev/modulo-cms" 
                className="hover:text-gray-700 transition-colors duration-200"
                style={{ color: theme?.colors?.primary || '#3b82f6' }}
              >
                Modulo CMS
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
