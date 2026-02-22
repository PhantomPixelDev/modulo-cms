import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { ShopProductsManager } from '../../components/shop/ShopProductsManager';
import { ShopOrdersManager } from '../../components/shop/ShopOrdersManager';
import { ShopOrderView } from '../../components/shop/ShopOrderView';
import { ShopSettingsForm } from '../../components/shop/ShopSettingsForm';
import type { Paginated, ShopProduct, ShopOrder } from '../../types';

export function getShopSections({
  shopProducts,
  shopOrders,
  shopOrder,
  shopSettings,
  can,
  showSuccess,
  showError,
  ROUTE,
}: {
  shopProducts: Paginated<ShopProduct> | undefined;
  shopOrders: Paginated<ShopOrder> | undefined;
  shopOrder: ShopOrder | undefined;
  shopSettings?: Record<string, any>;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderShopProducts = () => (
    <SectionWrapper
      title="Shop Products"
      description="Manage your store products and inventory."
    >
      <ShopProductsManager
        products={shopProducts}
        canView={can('view shop products')}
        canCreate={can('create shop products')}
        canEdit={can('edit shop products')}
        canDelete={can('delete shop products')}
      />
    </SectionWrapper>
  );

  const renderShopOrderView = () => (
    <SectionWrapper
      title="Order Details"
      description="View order information and update status."
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.orders.index())}>
          Back to Orders
        </Button>
      }
    >
      <ShopOrderView order={shopOrder} canManage={can('manage shop orders')} />
    </SectionWrapper>
  );

  const renderShopOrders = () => (
    <SectionWrapper
      title="Shop Orders"
      description="Track and manage customer orders."
    >
      <ShopOrdersManager
        orders={shopOrders}
        canView={can('view shop orders')}
        canManage={can('manage shop orders')}
      />
    </SectionWrapper>
  );

  const renderShopSettings = () => (
    <SectionWrapper
      title="Shop Settings"
      description="Configure your store settings and preferences."
    >
      <ShopSettingsForm
        settings={shopSettings || {}}
        canEdit={can('manage shop settings')}
        onSave={async (data) => {
          try {
            await router.put('/dashboard/admin/shop/settings', data, {
              preserveScroll: true,
              onSuccess: () => showSuccess('Shop settings saved successfully'),
              onError: () => showError('Failed to save shop settings'),
            });
          } catch (err) {
            console.error(err);
            showError('Error saving shop settings');
          }
        }}
      />
    </SectionWrapper>
  );

  return {
    'shop-products': renderShopProducts,
    'shop-orders': renderShopOrders,
    'shop-orders-view': renderShopOrderView,
    'shop-settings': renderShopSettings,
  };
}
