import { SectionWrapper } from '@modulo/ui';
import { Head } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopOrdersManager } from '../components/ShopOrdersManager';
import type { Paginated, ShopOrder } from '../types';

export default function Orders({ shopOrders }: { shopOrders?: Paginated<ShopOrder> }) {
    const can = useCan();

    return (
        <SectionWrapper title="Orders" description="Track and manage customer orders.">
            <Head title="Orders" />
            <ShopOrdersManager orders={shopOrders} canView={can('view shop orders')} canManage={can('manage shop orders')} />
        </SectionWrapper>
    );
}
