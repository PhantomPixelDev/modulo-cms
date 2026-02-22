import React, { useState } from 'react';
import Layout from './Layout';
import SEOHead from '@/components/SEOHead';
import { ShoppingCart, Filter, Grid, List, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  url?: string;
  published_at?: string;
  price?: number;
  sale_price?: number | null;
  currency?: string;
  sku?: string;
  stock?: number | null;
  in_stock?: boolean;
  featured?: boolean;
  categories?: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

interface ProductsProps {
  products?: {
    data: Product[];
  };
  posts?: {
    data: Product[];
  };
  categories?: Category[];
  filters?: {
    category?: string;
    search?: string;
    min_price?: string;
    max_price?: string;
    orderby?: string;
    order?: string;
  };
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string;
    next_page_url?: string;
  };
  site?: any;
  theme?: any;
  menus?: any;
  postType?: {
    plural_label?: string;
    description?: string;
    route_prefix?: string;
  };
}

export default function Products({ products, posts, categories, filters, pagination, site, theme, menus, postType }: ProductsProps) {
  const { t } = useTranslation();
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  // Support both products and posts props
  const list: Product[] = Array.isArray(products?.data) 
    ? products.data 
    : Array.isArray(posts?.data) 
      ? posts.data 
      : [];

  const prefix = postType?.route_prefix || 'shop';
  const pageTitle = postType?.plural_label || t('theme.products.shop', {}, 'Shop');
  const pageDescription = postType?.description || 'Browse our products.';

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const formatPrice = (price?: number, currency = 'USD') => {
    if (price === undefined || price === null) return '';
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CNY: '¥',
    };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const getDiscountPercent = (price?: number, salePrice?: number | null) => {
    if (!price || !salePrice || salePrice >= price) return null;
    return Math.round(((price - salePrice) / price) * 100);
  };

  return (
    <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title={pageTitle} description={pageDescription}>
      <SEOHead title={`${pageTitle} | ${safeSite.name}`} description={pageDescription} />

      <div className="space-y-8">
        {/* Hero Header */}
        <header className="text-center py-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">{pageDescription}</p>
          {pagination && <p className="mt-4 text-sm opacity-75">{t('theme.products.products_count', { count: pagination.total }, `${pagination.total} products`)}</p>}
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {t('theme.products.filters', {}, 'Filters')}
            </button>
            {filters?.category && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {filters.category}
                <a href="/shop" className="ml-2 hover:text-indigo-900">×</a>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <select
              defaultValue={filters?.orderby || 'date'}
              onChange={(e) => window.location.href = `/shop?orderby=${e.target.value}`}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">{t('theme.products.latest', {}, 'Latest')}</option>
              <option value="price">{t('theme.products.price_low_to_high', {}, 'Price: Low to High')}</option>
              <option value="title">{t('theme.products.name', {}, 'Name')}</option>
              <option value="popularity">{t('theme.products.popularity', {}, 'Popularity')}</option>
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {showFilters && categories && categories.length > 0 && (
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">{t('theme.products.categories', {}, 'Categories')}</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/shop" className={`block py-1 ${!filters?.category ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}>
                      {t('theme.products.all_products', {}, 'All Products')}
                    </a>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <a
                        href={`/shop?category=${cat.slug}`}
                        className={`block py-1 ${filters?.category === cat.slug ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        {cat.name}
                        {cat.posts_count !== undefined && (
                          <span className="text-gray-400 text-sm ml-2">({cat.posts_count})</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {/* Product Grid/List */}
          <div className="flex-1">
            {list.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">{t('theme.products.no_products', {}, 'No products found.')}</p>
                {filters?.category && (
                  <a href="/shop" className="inline-block mt-4 text-indigo-600 hover:text-indigo-700">
                    {t('theme.products.view_all_products', {}, 'View all products')} →
                  </a>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {list.map((p) => {
                  if (!p || typeof p !== 'object' || !p.id) return null;
                  const href = p.url || `/${prefix}/${p.slug || ''}`;
                  const discount = getDiscountPercent(p.price, p.sale_price);
                  const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;
                  
                  return (
                    <article key={p.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {p.featured_image ? (
                          <a href={href} className="block w-full h-full">
                            <img
                              src={p.featured_image}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </a>
                        ) : (
                          <a href={href} className="flex items-center justify-center w-full h-full text-gray-400">
                            <ShoppingCart className="w-12 h-12" />
                          </a>
                        )}
                        {discount && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{discount}%
                          </span>
                        )}
                        {p.in_stock === false && (
                          <span className="absolute top-3 left-3 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">
                            {t('theme.products.out_of_stock', {}, 'Out of Stock')}
                          </span>
                        )}
                        {p.featured && (
                          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                            {t('theme.products.featured', {}, 'Featured')}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {p.categories && p.categories.length > 0 && (
                          <p className="text-xs text-gray-500 mb-1">
                            {p.categories.map(c => c.name).join(', ')}
                          </p>
                        )}
                        <h2 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          <a href={href} className="hover:text-indigo-600 transition-colors">
                            {p.title || '(untitled)'}
                          </a>
                        </h2>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {p.sale_price && p.sale_price < (p.price || 0) && (
                              <span className="text-gray-400 line-through text-sm">
                                {formatPrice(p.price, p.currency)}
                              </span>
                            )}
                            <span className={`font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(displayPrice, p.currency)}
                            </span>
                          </div>
                        </div>
                        <button
                          className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          disabled={p.in_stock === false}
                          data-product-id={p.id}
                        >
                          {p.in_stock === false
                            ? t('theme.products.out_of_stock', {}, 'Out of Stock')
                            : t('theme.products.add_to_cart', {}, 'Add to Cart')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {list.map((p) => {
                  if (!p || typeof p !== 'object' || !p.id) return null;
                  const href = p.url || `/${prefix}/${p.slug || ''}`;
                  const discount = getDiscountPercent(p.price, p.sale_price);
                  const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;
                  
                  return (
                    <article key={p.id} className="flex gap-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all p-4">
                      <div className="relative w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                        {p.featured_image ? (
                          <a href={href} className="block w-full h-full">
                            <img src={p.featured_image} alt={p.title} className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-400">
                            <ShoppingCart className="w-12 h-12" />
                          </div>
                        )}
                        {discount && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {p.categories && p.categories.length > 0 && (
                            <p className="text-xs text-gray-500 mb-1">
                              {p.categories.map(c => c.name).join(', ')}
                            </p>
                          )}
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            <a href={href} className="hover:text-indigo-600 transition-colors">{p.title}</a>
                          </h2>
                          {p.excerpt && <p className="text-gray-600 text-sm line-clamp-2">{p.excerpt}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-2">
                            {p.sale_price && p.sale_price < (p.price || 0) && (
                              <span className="text-gray-400 line-through">{formatPrice(p.price, p.currency)}</span>
                            )}
                            <span className={`text-xl font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(displayPrice, p.currency)}
                            </span>
                          </div>
                          <button
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
                            disabled={p.in_stock === false}
                            data-product-id={p.id}
                          >
                            {p.in_stock === false
                              ? t('theme.products.out_of_stock', {}, 'Out of Stock')
                              : t('theme.products.add_to_cart', {}, 'Add to Cart')}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                {pagination.prev_page_url && (
                  <a href={pagination.prev_page_url} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    ← {t('theme.buttons.previous', {}, 'Previous')}
                  </a>
                )}
                <span className="px-4 py-2 text-gray-600">
                  {t('theme.posts.pagination', { current: pagination.current_page, total: pagination.last_page }, `Page ${pagination.current_page} of ${pagination.last_page}`)}
                </span>
                {pagination.next_page_url && (
                  <a href={pagination.next_page_url} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    {t('theme.buttons.next', {}, 'Next')} →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
