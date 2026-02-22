import React, { useState } from 'react';
import Layout from '../Layout';
import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ShoppingCart, Minus, Plus, Check, Heart, Truck, Shield, RotateCcw, ChevronRight, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Product {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  url?: string;
  price?: number;
  sale_price?: number | null;
  currency?: string;
  sku?: string;
  stock?: number | null;
  in_stock?: boolean;
  featured?: boolean;
  gallery?: string[];
  attributes?: Record<string, string>;
  categories?: Array<{ id: number; name: string; slug: string }>;
  tags?: Array<{ id: number; name: string; slug: string }>;
}

interface RelatedProduct {
  id: number;
  title: string;
  slug: string;
  featured_image?: string;
  url?: string;
  price?: number;
  sale_price?: number | null;
  currency?: string;
}

interface ShopSingleProps {
  product?: Product;
  relatedProducts?: RelatedProduct[];
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Single({ product, relatedProducts, site, theme, menus }: ShopSingleProps) {
  const { t } = useTranslation();
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  if (!product) {
    return (
      <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title={t('theme.products.not_found', {}, 'Product Not Found')}>
        <div className="text-center py-20">
          <ShoppingCart className="w-20 h-20 mx-auto text-gray-200 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('theme.products.not_found', {}, 'Product Not Found')}</h1>
          <p className="text-gray-500 mb-6">{t('theme.products.not_found_description', {}, "The product you're looking for doesn't exist.")}</p>
          <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
            ← {t('theme.products.back_to_shop', {}, 'Back to Shop')}
          </Link>
        </div>
      </Layout>
    );
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.featured_image || '');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const addToCart = async () => {
    setAddingToCart(true);
    setCartMessage(null);
    try {
      const response = await fetch('/shop/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      const data = await response.json();
      if (data.success) {
        setCartMessage({ type: 'success', text: t('theme.products.added_to_cart', {}, 'Added to cart!') });
        setTimeout(() => setCartMessage(null), 3000);
      } else {
        setCartMessage({ type: 'error', text: data.message || t('theme.products.failed_to_add_to_cart', {}, 'Failed to add to cart') });
      }
    } catch (error) {
      setCartMessage({ type: 'error', text: t('theme.products.failed_to_add_to_cart', {}, 'Failed to add to cart') });
    }
    setAddingToCart(false);
  };

  const formatPrice = (price?: number, currency = 'USD') => {
    if (price === undefined || price === null) return '';
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${price.toFixed(2)}`;
  };

  const getDiscountPercent = () => {
    if (!product.price || !product.sale_price || product.sale_price >= product.price) return null;
    return Math.round(((product.price - product.sale_price) / product.price) * 100);
  };

  const displayPrice = product.sale_price && product.sale_price < (product.price || 0) ? product.sale_price : product.price;
  const discount = getDiscountPercent();
  const allImages = [product.featured_image, ...(product.gallery || [])].filter(Boolean) as string[];
  const inStock = product.in_stock !== false && (product.stock === null || product.stock === undefined || product.stock > 0);
  const maxQuantity = product.stock || 99;

  return (
    <Layout
      title={product.title}
      description={product.excerpt}
      ogImage={product.featured_image}
      site={safeSite}
      theme={safeTheme}
      menus={safeMenus}
    >
      <SEOHead title={`${product.title} | ${safeSite.name}`} description={product.excerpt} />

      <div className="py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-indigo-600 transition-colors">{t('theme.products.home', {}, 'Home')}</Link></li>
            <li><ChevronRight className="w-4 h-4" /></li>
            <li><Link href="/shop" className="hover:text-indigo-600 transition-colors">{t('theme.products.shop', {}, 'Shop')}</Link></li>
            {product.categories && product.categories.length > 0 && (
              <>
                <li><ChevronRight className="w-4 h-4" /></li>
                <li>
                  <Link href={`/product-category/${product.categories[0].slug}`} className="hover:text-indigo-600 transition-colors">
                    {product.categories[0].name}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRight className="w-4 h-4" /></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
              {selectedImage ? (
                <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-300">
                  <ShoppingCart className="w-24 h-24" />
                </div>
              )}
              {discount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  {t('theme.products.save_percent', { percent: discount }, `Save ${discount}%`)}
                </span>
              )}
              {!inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl">
                    {t('theme.products.out_of_stock', {}, 'Out of Stock')}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === img ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Categories */}
            {product.categories && product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/product-category/${cat.slug}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">{product.title}</h1>

            {/* Rating Placeholder */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="text-sm text-gray-500">{t('theme.products.reviews_count', { count: 0 }, '(0 reviews)')}</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 py-4 border-y border-gray-100">
              {product.sale_price && product.sale_price < (product.price || 0) && (
                <span className="text-2xl text-gray-400 line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
              <span className={`text-4xl font-bold ${product.sale_price && product.sale_price < (product.price || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                {formatPrice(displayPrice, product.currency)}
              </span>
              {discount && (
                <span className="bg-red-100 text-red-700 text-sm font-semibold px-4 py-1.5 rounded-full">
                  {t('theme.products.save_percent', { percent: discount }, `Save ${discount}%`)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3">
              {inStock ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">
                    {product.stock
                      ? t('theme.products.in_stock_available', { count: product.stock }, `In Stock (${product.stock} available)`)
                      : t('theme.products.in_stock', {}, 'In Stock')}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-medium">{t('theme.products.out_of_stock', {}, 'Out of Stock')}</span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.excerpt && (
              <p className="text-gray-600 text-lg leading-relaxed">{product.excerpt}</p>
            )}

            {/* Attributes */}
            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-gray-500 capitalize min-w-[100px]">{key}:</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Message */}
            {cartMessage && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${cartMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {cartMessage.type === 'success' ? <Check className="w-5 h-5" /> : null}
                {cartMessage.text}
                {cartMessage.type === 'success' && (
                  <Link href="/shop/cart" className="ml-auto text-sm font-medium underline">{t('theme.products.view_cart', {}, 'View Cart')}</Link>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            {inStock && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-4 hover:bg-gray-50 transition-colors rounded-l-xl"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center border-x border-gray-200 py-3 font-medium focus:outline-none"
                    min="1"
                    max={maxQuantity}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    className="p-4 hover:bg-gray-50 transition-colors rounded-r-xl"
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={addToCart}
                  disabled={addingToCart}
                  className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 px-8 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addingToCart ? t('theme.products.adding', {}, 'Adding...') : t('theme.products.add_to_cart', {}, 'Add to Cart')}
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isWishlisted ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-gray-500">
                {t('theme.products.sku', { sku: product.sku }, `SKU: ${product.sku}`)}
              </p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">{t('theme.products.tags', {}, 'Tags:')}</span>
                {product.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/shop?tag=${tag.slug}`}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100">
              <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Truck className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('theme.products.free_shipping', {}, 'Free Shipping')}</p>
                  <p className="text-xs text-gray-500">{t('theme.products.shipping_note', { amount: '$50' }, 'On orders over $50')}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Shield className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('theme.products.secure_payment', {}, 'Secure Payment')}</p>
                  <p className="text-xs text-gray-500">{t('theme.products.secure_payment_note', {}, '100% protected')}</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center gap-3 p-4 bg-gray-50 rounded-xl">
                <RotateCcw className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{t('theme.products.easy_returns', {}, 'Easy Returns')}</p>
                  <p className="text-xs text-gray-500">{t('theme.products.returns_note', { days: 30 }, '30 day returns')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        {product.content && (
          <div className="mt-16 bg-white rounded-3xl border border-gray-100 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('theme.products.description', {}, 'Product Description')}</h2>
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-indigo-600"
              dangerouslySetInnerHTML={{ __html: product.content }}
            />
          </div>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t('theme.products.you_may_also_like', {}, 'You May Also Like')}</h2>
              <Link href="/shop" className="text-indigo-600 hover:text-indigo-700 font-medium">
                {t('theme.products.view_all_products', {}, 'View all products')} →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p) => {
                const relatedDiscount = p.sale_price && p.price && p.sale_price < p.price
                  ? Math.round(((p.price - p.sale_price) / p.price) * 100)
                  : null;

                return (
                  <Link
                    key={p.id}
                    href={p.url || `/shop/${p.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      {p.featured_image ? (
                        <img
                          src={p.featured_image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingCart className="w-10 h-10" />
                        </div>
                      )}
                      {relatedDiscount && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{relatedDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                        {p.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {p.sale_price && p.sale_price < (p.price || 0) && (
                          <span className="text-gray-400 line-through text-sm">{formatPrice(p.price, p.currency)}</span>
                        )}
                        <span className="font-bold text-gray-900">
                          {formatPrice(p.sale_price || p.price, p.currency)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
