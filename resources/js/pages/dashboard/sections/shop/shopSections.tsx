import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { ShopProductsManager } from '../../components/shop/ShopProductsManager';
import { ShopOrdersManager } from '../../components/shop/ShopOrdersManager';
import { ShopOrderView } from '../../components/shop/ShopOrderView';
import type { Paginated, ShopProduct, ShopOrder } from '../../types';

export function getShopSections({
  shopProducts,
  shopOrders,
  shopOrder,
  can,
  ROUTE,
}: {
  shopProducts: Paginated<ShopProduct> | undefined;
  shopOrders: Paginated<ShopOrder> | undefined;
  shopOrder: ShopOrder | undefined;
  can: (perm: string) => boolean;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderShopProducts = () => (
    <SectionWrapper
      title="Shop Products"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
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
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
    >
      <ShopOrdersManager
        orders={shopOrders}
        canView={can('view shop orders')}
        canManage={can('manage shop orders')}
      />
    </SectionWrapper>
  );

  return {
    'shop-products': renderShopProducts,
    'shop-orders': renderShopOrders,
    'shop-orders-view': renderShopOrderView,
  };
}
