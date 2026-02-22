import React from 'react';
import Layout from './Layout';
import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';

interface IndexProps {
  posts?: {
    data: any[];
  };
  pagination?: any;
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Index({ posts, pagination, site, theme, menus }: IndexProps) {
  const { t, locale } = useTranslation();
  const safeSite = site || { name: 'Modulo CMS', tagline: 'Modern Content Management System' };
  const safeTheme = theme || { name: 'Modern React', slug: 'modern-react', version: '1.0.0' };
  const safeMenus = menus || {};
  const recentPosts = posts?.data?.slice(0, 3) || [];

  return (
    <Layout
      title={t('theme.home.title', {}, 'Home')}
      description={safeSite?.tagline || t('theme.home.hero.tagline', {}, 'Modern Content Management System')}
      site={safeSite}
      theme={safeTheme}
      menus={safeMenus}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-indigo-50 rounded-3xl mb-16 p-12 md:p-16">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-900 leading-tight">
            {t('theme.home.hero.title', {}, safeSite?.name || 'Modulo CMS')}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
            {safeSite?.tagline || t('theme.home.hero.tagline', {}, 'A powerful, modern content management system built with Laravel and React')}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/posts"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {t('theme.home.hero.primary_cta', {}, 'Browse Content')}
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-gray-200"
            >
              {t('theme.home.hero.secondary_cta', {}, 'Admin Dashboard')}
            </Link>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('theme.home.features.title', {}, 'Powerful Features')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('theme.home.features.items.flexible.title', {}, 'Flexible Content Types')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('theme.home.features.items.flexible.description', {}, 'Create custom post types and taxonomies to organize your content exactly how you need it.')}
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('theme.home.features.items.roles.title', {}, 'Role-Based Access')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('theme.home.features.items.roles.description', {}, 'Granular permissions system to control who can create, edit, and publish content.')}
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('theme.home.features.items.modern.title', {}, 'Modern UI/UX')}</h3>
            <p className="text-gray-600 leading-relaxed">
              {t('theme.home.features.items.modern.description', {}, 'Beautiful, responsive interface built with React, TypeScript, and Tailwind CSS.')}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Posts Section */}
      {recentPosts.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">{t('theme.home.latest.title', {}, 'Latest Updates')}</h2>
            <Link
              href="/posts"
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 group"
            >
              {t('theme.home.latest.view_all', {}, 'View all')}
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/${post.post_type?.route_prefix || 'posts'}/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
              >
                {post.featured_image && (
                  <div className="aspect-video overflow-hidden bg-indigo-100">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      {post.post_type?.label || t('theme.home.latest.badge_fallback', {}, 'Post')}
                    </span>
                    {post.published_at && (
                      <span className="text-sm text-gray-500">
                        {new Date(post.published_at).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-gray-600 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-indigo-700 rounded-3xl p-12 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('theme.home.cta.title', {}, 'Ready to Get Started?')}</h2>
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">{t('theme.home.cta.description', {}, 'Explore the admin dashboard to manage your content, or browse our documentation to learn more.')}</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            {t('theme.home.cta.primary', {}, 'Go to Dashboard')}
          </Link>
          <a
            href="https://github.com/PhantomPixelDev/modulo-cms"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-2 border-indigo-400"
          >
            {t('theme.home.cta.secondary', {}, 'View on GitHub')}
          </a>
        </div>
      </div>
    </Layout>
  );
}
