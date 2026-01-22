import React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ShopOrder } from '../../types';

interface OrderItem {
  id: number;
  product_name: string;
  product_sku?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ShopOrderDetail extends ShopOrder {
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  payment_method?: string;
  customer_phone?: string;
  billing_address?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  shipping_address?: {
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  customer_note?: string;
  admin_note?: string;
  items?: OrderItem[];
  created_at?: string;
}

interface ShopOrderViewProps {
  order?: ShopOrderDetail;
  canManage: boolean;
}

export function ShopOrderView({ order, canManage }: ShopOrderViewProps) {
  const formatPrice = (price?: number, currency = 'USD') => {
    const value = typeof price === 'number' ? price : 0;
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] || '$'}${value.toFixed(2)}`;
  };

  const formatAddress = (address?: ShopOrderDetail['billing_address']) => {
    if (!address) return '—';
    return [
      address.address_1,
      address.address_2,
      `${address.city || ''}${address.state ? `, ${address.state}` : ''} ${address.postcode || ''}`.trim(),
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  };

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order not found</CardTitle>
          <CardDescription>The requested order could not be loaded.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => router.visit('/dashboard/admin/shop/orders')}>
            Back to Orders
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Order {order.order_number}</CardTitle>
            <CardDescription>Placed by {order.customer_name}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.visit('/dashboard/admin/shop/orders')}>
              Back to Orders
            </Button>
            {canManage && (
              <Button variant="outline" onClick={() => router.visit('/dashboard/admin/shop/orders')}>
                Manage Orders
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">{order.status_label}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Payment</div>
            <div className="font-medium">{order.payment_status_label}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Customer</div>
            <div className="font-medium">{order.customer_name}</div>
            <div className="text-sm text-muted-foreground">{order.customer_email}</div>
            {order.customer_phone ? <div className="text-sm text-muted-foreground">{order.customer_phone}</div> : null}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-medium">{formatPrice(order.total, order.currency)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Billing Address</div>
            <div className="text-sm">{formatAddress(order.billing_address)}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Shipping Address</div>
            <div className="text-sm">{formatAddress(order.shipping_address)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.product_sku || '—'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.price, order.currency)}</TableCell>
                    <TableCell className="text-right">{formatPrice(item.subtotal, order.currency)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-end gap-6">
          <div className="text-sm text-muted-foreground">Subtotal</div>
          <div className="font-medium">{formatPrice(order.subtotal, order.currency)}</div>
          <div className="text-sm text-muted-foreground">Shipping</div>
          <div className="font-medium">{formatPrice(order.shipping, order.currency)}</div>
          <div className="text-sm text-muted-foreground">Tax</div>
          <div className="font-medium">{formatPrice(order.tax, order.currency)}</div>
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="font-semibold">{formatPrice(order.total, order.currency)}</div>
        </CardFooter>
      </Card>

      {(order.customer_note || order.admin_note) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.customer_note && (
              <div>
                <div className="text-sm text-muted-foreground">Customer Note</div>
                <div>{order.customer_note}</div>
              </div>
            )}
            {order.admin_note && (
              <div>
                <div className="text-sm text-muted-foreground">Admin Note</div>
                <div>{order.admin_note}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
