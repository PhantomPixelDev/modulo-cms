import React, { useState } from 'react';
import Layout from '../Layout';
import SEOHead from '@/components/SEOHead';
import { ShoppingCart, Filter, Grid, List, Search, X } from 'lucide-react';

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
  featured?: boolean;
  categories?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  posts_count?: number;
}

interface ShopArchiveProps {
  products?: {
    data: Product[];
  };
  categories?: Category[];
  filters?: {
    category?: string;
    tag?: string;
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
  };
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Archive({ products, categories, filters, pagination, site, theme, menus }: ShopArchiveProps) {
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  const list: Product[] = Array.isArray(products?.data) ? products.data : [];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters?.search || '');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatPrice = (price?: number, currency = 'USD') => {
    if (price === undefined || price === null) return '';
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const getDiscountPercent = (price?: number, salePrice?: number | null) => {
    if (!price || !salePrice || salePrice >= price) return null;
    return Math.round(((price - salePrice) / price) * 100);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
  };

  const addToCart = async (productId: number) => {
    setAddingId(productId);
    setCartMessage(null);
    try {
      const response = await fetch('/shop/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ product_id: productId, quantity: 1 }),
      });
      const data = await response.json();
      if (data.success) {
        setCartMessage({ type: 'success', text: 'Added to cart!' });
        setTimeout(() => setCartMessage(null), 3000);
      } else {
        setCartMessage({ type: 'error', text: data.message || 'Failed to add to cart' });
      }
    } catch (error) {
      setCartMessage({ type: 'error', text: 'Failed to add to cart' });
    }
    setAddingId(null);
  };

  return (
    <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title="Shop" description="Browse our products">
      <SEOHead title={`Shop | ${safeSite.name}`} description="Browse our products and find what you need." />

      <div className="space-y-8">
        {/* Hero Header */}
        <header className="relative py-16 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Shop</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto mb-8">
              Discover our amazing collection of products
            </p>
            {pagination && (
              <p className="text-sm opacity-75">{pagination.total} products available</p>
            )}
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-8">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-6 py-4 pr-12 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </header>

        {/* Cart Message */}
        {cartMessage && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 ${cartMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {cartMessage.text}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {filters?.category && (
              <span className="flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {filters.category}
                <a href="/shop" className="hover:text-indigo-900"><X className="w-3 h-3" /></a>
              </span>
            )}
            {filters?.search && (
              <span className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                "{filters.search}"
                <a href="/shop" className="hover:text-purple-900"><X className="w-3 h-3" /></a>
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <select
              defaultValue={filters?.orderby || 'date'}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                params.set('orderby', e.target.value);
                window.location.href = `/shop?${params.toString()}`;
              }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {showFilters && (
            <aside className="w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4 space-y-6">
                {/* Categories */}
                {categories && categories.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                    <ul className="space-y-2">
                      <li>
                        <a
                          href="/shop"
                          className={`block py-2 px-3 rounded-lg transition-colors ${
                            !filters?.category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Products
                        </a>
                      </li>
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <a
                            href={`/shop?category=${cat.slug}`}
                            className={`flex justify-between py-2 px-3 rounded-lg transition-colors ${
                              filters?.category === cat.slug ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{cat.name}</span>
                            {cat.posts_count !== undefined && (
                              <span className="text-gray-400 text-sm">({cat.posts_count})</span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      defaultValue={filters?.min_price}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      onBlur={(e) => {
                        const params = new URLSearchParams(window.location.search);
                        if (e.target.value) params.set('min_price', e.target.value);
                        else params.delete('min_price');
                        window.location.href = `/shop?${params.toString()}`;
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      defaultValue={filters?.max_price}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      onBlur={(e) => {
                        const params = new URLSearchParams(window.location.search);
                        if (e.target.value) params.set('max_price', e.target.value);
                        else params.delete('max_price');
                        window.location.href = `/shop?${params.toString()}`;
                      }}
                    />
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Product Grid/List */}
          <div className="flex-1">
            {list.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <ShoppingCart className="w-20 h-20 mx-auto text-gray-200 mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
                <a href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                  View all products
                </a>
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
                          <a href={href} className="block w-full h-full">
                            <img
                              src={p.featured_image}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </a>
                        ) : (
                          <a href={href} className="flex items-center justify-center w-full h-full text-gray-300">
                            <ShoppingCart className="w-16 h-16" />
                          </a>
                        )}
                        {discount && (
                          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                            -{discount}%
                          </span>
                        )}
                        {p.in_stock === false && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium text-sm">
                              Out of Stock
                            </span>
                          </div>
                        )}
                        {p.featured && !discount && (
                          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        {p.categories && p.categories.length > 0 && (
                          <p className="text-xs text-indigo-600 font-medium mb-2">
                            {p.categories.map(c => c.name).join(' • ')}
                          </p>
                        )}
                        <h2 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          <a href={href}>{p.title}</a>
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
                          onClick={() => addToCart(p.id)}
                          className={`w-full py-2.5 rounded-xl font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                            p.in_stock === false || addingId === p.id
                              ? 'bg-gray-100 text-gray-400'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                          disabled={p.in_stock === false || addingId === p.id}
                        >
                          {p.in_stock === false ? 'Out of Stock' : addingId === p.id ? 'Adding...' : 'Add to Cart'}
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
                    <article key={p.id} className="flex flex-col sm:flex-row gap-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all p-5">
                      <div className="relative w-full sm:w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
                        {p.featured_image ? (
                          <a href={href} className="block w-full h-full">
                            <img src={p.featured_image} alt={p.title} className="w-full h-full object-cover" />
                          </a>
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
                      <div className="flex-1 flex flex-col justify-between gap-4">
                        <div>
                          {p.categories && p.categories.length > 0 && (
                            <p className="text-xs text-indigo-600 font-medium mb-1">
                              {p.categories.map(c => c.name).join(' • ')}
                            </p>
                          )}
                          <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            <a href={href} className="hover:text-indigo-600 transition-colors">{p.title}</a>
                          </h2>
                          {p.excerpt && <p className="text-gray-500 text-sm line-clamp-2">{p.excerpt}</p>}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            {p.sale_price && p.sale_price < (p.price || 0) && (
                              <span className="text-gray-400 line-through text-sm">{formatPrice(p.price, p.currency)}</span>
                            )}
                            <span className={`text-lg font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(displayPrice, p.currency)}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(p.id)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              p.in_stock === false || addingId === p.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                            disabled={p.in_stock === false || addingId === p.id}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {p.in_stock === false ? 'Out of Stock' : addingId === p.id ? 'Adding...' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}
