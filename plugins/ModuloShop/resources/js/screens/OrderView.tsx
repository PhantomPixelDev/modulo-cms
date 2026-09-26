import { Button, SectionWrapper } from '@modulo/ui';
import { Head, Link } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopOrderView } from '../components/ShopOrderView';
import { ROUTE } from '../routes';
import type { ShopOrder } from '../types';

export default function OrderView({ shopOrder }: { shopOrder?: ShopOrder }) {
    const can = useCan();

    return (
        <SectionWrapper
            title={shopOrder ? `Order ${shopOrder.order_number}` : 'Order'}
            description="View order information and update status."
            actions={
                <Button variant="outline" size="sm" asChild>
                    <Link href={ROUTE.shop.orders.index()}>Back to orders</Link>
                </Button>
            }
        >
            <Head title={shopOrder ? `Order ${shopOrder.order_number}` : 'Order'} />
            <ShopOrderView order={shopOrder} canManage={can('manage shop orders')} />
        </SectionWrapper>
    );
}
