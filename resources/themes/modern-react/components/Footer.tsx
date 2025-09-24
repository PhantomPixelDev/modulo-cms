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
    <footer className="bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-purple-900/95 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br from-blue-500 to-purple-600">
                {(site?.name || 'M').charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-white">
                {site?.name || 'Modulo CMS'}
              </h3>
            </div>
            {site?.tagline && (
              <p className="text-blue-100/80 mb-6 max-w-md leading-relaxed">
                {site.tagline}
              </p>
            )}
            <p className="text-sm text-blue-100/60 leading-relaxed">
              Built with Modulo CMS - A modern, flexible content management system designed for the future.
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Navigation
            </h4>
            <nav className="space-y-3">
              {menu?.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  target={item.target}
                  className="block text-blue-100/80 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact/Social Column */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
              Connect
            </h4>
            <div className="space-y-3">
              <a 
                href="mailto:hello@example.com" 
                className="block text-blue-100/80 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
              >
                Contact Us
              </a>
              <a 
                href="/privacy" 
                className="block text-blue-100/80 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="block text-blue-100/80 hover:text-white text-sm transition-all duration-300 hover:translate-x-1"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-blue-100/60">
              &copy; {currentYear} {site?.name || 'Modulo CMS'}. All rights reserved.
            </p>
            <p className="text-sm text-blue-100/60 mt-2 md:mt-0">
              Powered by{' '}
              <a 
                href="https://github.com/PhantomPixelDev/modulo-cms" 
                className="text-blue-300 hover:text-white transition-colors duration-300 font-medium"
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
