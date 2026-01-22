import React, { useState } from 'react';
import Layout from '../Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ShoppingCart, Grid, List, ChevronRight } from 'lucide-react';

interface Product {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  url?: string;
  price?: number;
  sale_price?: number | null;
  currency?: string;
  in_stock?: boolean;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface ShopCategoryProps {
  category?: Category;
  products?: {
    data: Product[];
  };
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  site?: any;
  theme?: any;
  menus?: any;
}

export default function CategoryPage({ category, products, pagination, site, theme, menus }: ShopCategoryProps) {
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  const list: Product[] = Array.isArray(products?.data) ? products.data : [];
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const formatPrice = (price?: number, currency = 'USD') => {
    if (price === undefined || price === null) return '';
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const getDiscountPercent = (price?: number, salePrice?: number | null) => {
    if (!price || !salePrice || salePrice >= price) return null;
    return Math.round(((price - salePrice) / price) * 100);
  };

  if (!category) {
    return (
      <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Category Not Found">
        <div className="text-center py-20">
          <ShoppingCart className="w-20 h-20 mx-auto text-gray-200 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-500 mb-6">The category you're looking for doesn't exist.</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
            ← Back to Shop
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={category.name}
      description={category.description}
      site={safeSite}
      theme={safeTheme}
      menus={safeMenus}
    >
      <SEOHead title={`${category.name} | Shop | ${safeSite.name}`} description={category.description} />

      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav>
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
            <li><ChevronRight className="w-4 h-4" /></li>
            <li><Link href="/shop" className="hover:text-indigo-600 transition-colors">Shop</Link></li>
            <li><ChevronRight className="w-4 h-4" /></li>
            <li className="text-gray-900 font-medium">{category.name}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <header className="relative py-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-xl opacity-90 max-w-2xl mx-auto mb-4">{category.description}</p>
            )}
            {pagination && (
              <p className="text-sm opacity-75">{pagination.total} products in this category</p>
            )}
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Link href="/shop" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
              ← All Products
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <select
              defaultValue="date"
              onChange={(e) => {
                window.location.href = `/product-category/${category.slug}?orderby=${e.target.value}`;
              }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="date">Latest</option>
              <option value="price">Price: Low to High</option>
              <option value="title">Name A-Z</option>
              <option value="popularity">Most Popular</option>
            </select>
            <div className="flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        {list.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <ShoppingCart className="w-20 h-20 mx-auto text-gray-200 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products in this category</h3>
            <p className="text-gray-500 mb-6">Check back later or browse other categories</p>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              View all products
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {list.map((p) => {
              const href = p.url || `/shop/${p.slug}`;
              const discount = getDiscountPercent(p.price, p.sale_price);
              const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

              return (
                <article key={p.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden bg-gray-50">
                    {p.featured_image ? (
                      <Link href={href} className="block w-full h-full">
                        <img
                          src={p.featured_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </Link>
                    ) : (
                      <Link href={href} className="flex items-center justify-center w-full h-full text-gray-300">
                        <ShoppingCart className="w-16 h-16" />
                      </Link>
                    )}
                    {discount && (
                      <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                        -{discount}%
                      </span>
                    )}
                    {p.in_stock === false && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      <Link href={href}>{p.title}</Link>
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      {p.sale_price && p.sale_price < (p.price || 0) && (
                        <span className="text-gray-400 line-through text-sm">{formatPrice(p.price, p.currency)}</span>
                      )}
                      <span className={`text-lg font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatPrice(displayPrice, p.currency)}
                      </span>
                    </div>
                    <button
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      disabled={p.in_stock === false}
                      data-product-id={p.id}
                    >
                      {p.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((p) => {
              const href = p.url || `/shop/${p.slug}`;
              const discount = getDiscountPercent(p.price, p.sale_price);
              const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

              return (
                <article key={p.id} className="flex gap-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all p-5">
                  <div className="relative w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                    {p.featured_image ? (
                      <Link href={href} className="block w-full h-full">
                        <img src={p.featured_image} alt={p.title} className="w-full h-full object-cover" />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-300">
                        <ShoppingCart className="w-12 h-12" />
                      </div>
                    )}
                    {discount && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href={href} className="hover:text-indigo-600 transition-colors">{p.title}</Link>
                      </h2>
                      {p.excerpt && <p className="text-gray-500 text-sm line-clamp-2">{p.excerpt}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        {p.sale_price && p.sale_price < (p.price || 0) && (
                          <span className="text-gray-400 line-through">{formatPrice(p.price, p.currency)}</span>
                        )}
                        <span className={`text-2xl font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatPrice(displayPrice, p.currency)}
                        </span>
                      </div>
                      <button
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300"
                        disabled={p.in_stock === false}
                        data-product-id={p.id}
                      >
                        {p.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
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
          <div className="flex justify-center items-center gap-2 mt-12">
            {pagination.current_page > 1 && (
              <Link
                href={`/product-category/${category.slug}?page=${pagination.current_page - 1}`}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-600">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            {pagination.current_page < pagination.last_page && (
              <Link
                href={`/product-category/${category.slug}?page=${pagination.current_page + 1}`}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
