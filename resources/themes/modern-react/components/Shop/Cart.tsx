import React, { useState } from 'react';
import Layout from '../Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image?: string;
  product_url: string;
  sku?: string;
  price: number;
  original_price: number;
  quantity: number;
  subtotal: number;
  stock?: number | null;
  in_stock: boolean;
}

interface CartProps {
  cart?: {
    items: CartItem[];
    item_count: number;
    subtotal: number;
    currency: string;
    is_empty: boolean;
  };
  totals?: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Cart({ cart, totals, site, theme, menus }: CartProps) {
  const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  const [items, setItems] = useState<CartItem[]>(cart?.items ?? []);
  const [loading, setLoading] = useState<number | null>(null);
  const [cartTotals, setCartTotals] = useState(totals);

  const formatPrice = (price: number, currency = 'USD') => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const updateQuantity = async (productId: number, newQuantity: number) => {
    setLoading(productId);
    try {
      const response = await fetch('/shop/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.cart.items);
        setCartTotals({
          ...cartTotals!,
          subtotal: data.cart.subtotal,
          total: data.cart.subtotal,
        });
      }
    } catch (error) {
      console.error('Failed to update cart', error);
    }
    setLoading(null);
  };

  const removeItem = async (productId: number) => {
    setLoading(productId);
    try {
      const response = await fetch('/shop/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ product_id: productId }),
      });
      const data = await response.json();
      if (data.success) {
        setItems(data.cart.items);
        setCartTotals({
          ...cartTotals!,
          subtotal: data.cart.subtotal,
          total: data.cart.subtotal,
        });
      }
    } catch (error) {
      console.error('Failed to remove item', error);
    }
    setLoading(null);
  };

  const isEmpty = items.length === 0;

  return (
    <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Shopping Cart">
      <SEOHead
        title="Shopping Cart"
        description="Review your shopping cart"
        site={safeSite}
      />

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <Link href="/" className="hover:text-indigo-600">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-indigo-600">Shop</Link>
            <span>/</span>
            <span className="text-gray-900">Cart</span>
          </nav>

          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            Shopping Cart
          </h1>

          {isEmpty ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <ShoppingBag className="w-20 h-20 mx-auto text-gray-200 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-500 mb-8">Looks like you haven't added any products yet.</p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className={`bg-white rounded-xl shadow-sm p-6 flex gap-6 ${loading === item.product_id ? 'opacity-50' : ''}`}
                  >
                    {/* Product Image */}
                    <Link href={item.product_url} className="shrink-0">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={item.product_url}>
                        <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                          {item.product_name}
                        </h3>
                      </Link>
                      {item.sku && (
                        <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-bold text-lg text-gray-900">
                          {formatPrice(item.price, cartTotals?.currency)}
                        </span>
                        {item.original_price > item.price && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatPrice(item.original_price, cartTotals?.currency)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex items-center border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          disabled={loading === item.product_id || item.quantity <= 1}
                          className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={loading === item.product_id || (item.stock !== null && item.quantity >= item.stock)}
                          className="p-2 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {formatPrice(item.subtotal, cartTotals?.currency)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        disabled={loading === item.product_id}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

                  <div className="space-y-4">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotals?.subtotal ?? 0, cartTotals?.currency)}</span>
                    </div>
                    {(cartTotals?.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(cartTotals?.discount ?? 0, cartTotals?.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span>{cartTotals?.shipping ? formatPrice(cartTotals.shipping, cartTotals.currency) : 'Calculated at checkout'}</span>
                    </div>
                    {(cartTotals?.tax ?? 0) > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Tax</span>
                        <span>{formatPrice(cartTotals?.tax ?? 0, cartTotals?.currency)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total</span>
                        <span>{formatPrice(cartTotals?.total ?? 0, cartTotals?.currency)}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/shop/checkout"
                    className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/shop"
                    className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
