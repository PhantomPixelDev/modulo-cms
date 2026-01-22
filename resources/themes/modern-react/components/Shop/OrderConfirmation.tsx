import React from 'react';
import Layout from '../Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { CheckCircle, Package, MapPin, CreditCard, Mail, Phone, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
  product_data?: {
    slug?: string;
    image?: string;
  };
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  payment_status: string;
  payment_status_label: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  billing_address: {
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  shipping_address: {
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  customer_note?: string;
  items: OrderItem[];
  created_at: string;
}

interface OrderConfirmationProps {
  order?: Order;
  site?: any;
  theme?: any;
  menus?: any;
}

export default function OrderConfirmation({ order, site, theme, menus }: OrderConfirmationProps) {
  const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  const formatPrice = (price: number, currency = 'USD') => {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const formatAddress = (address: Order['billing_address']) => {
    const parts = [
      address.address_1,
      address.address_2,
      `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postcode}`,
      address.country,
    ].filter(Boolean);
    return parts;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cod: 'Cash on Delivery',
      bank_transfer: 'Bank Transfer',
      stripe: 'Credit Card',
    };
    return labels[method] || method;
  };

  if (!order) {
    return (
      <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Order Not Found">
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <Package className="w-20 h-20 mx-auto text-gray-200 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h1>
            <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
              Continue Shopping
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title={`Order ${order.order_number}`}>
      <SEOHead title={`Order Confirmed - ${order.order_number}`} description="Thank you for your order" site={safeSite} />

      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Message */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank you for your order!</h1>
            <p className="text-gray-600 mb-4">Your order has been received and is being processed.</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-bold text-gray-900">{order.order_number}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                Order Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-medium text-gray-900">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium text-gray-900">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {order.status_label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status_label}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Customer Information
              </h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-900">{order.customer_name}</p>
                <p className="text-gray-600">{order.customer_email}</p>
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                Billing Address
              </h2>
              <div className="text-sm text-gray-600">
                {formatAddress(order.billing_address).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Payment Method
              </h2>
              <p className="text-sm text-gray-600">{getPaymentMethodLabel(order.payment_method)}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
                  {item.product_data?.image ? (
                    <img src={item.product_data.image} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.product_name}</p>
                    {item.product_sku && <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatPrice(item.subtotal, order.currency)}</p>
                    <p className="text-sm text-gray-500">{formatPrice(item.price, order.currency)} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t mt-6 pt-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{order.shipping > 0 ? formatPrice(order.shipping, order.currency) : 'Free'}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Customer Note */}
          {order.customer_note && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Notes</h2>
              <p className="text-gray-600">{order.customer_note}</p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
