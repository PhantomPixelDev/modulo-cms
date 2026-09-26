import { SectionWrapper } from '@modulo/ui';
import { Head } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopCouponsManager } from '../components/ShopCouponsManager';
import type { Paginated, ShopCoupon } from '../types';

export default function Coupons({ shopCoupons }: { shopCoupons?: Paginated<ShopCoupon> }) {
    const can = useCan();

    return (
        <SectionWrapper title="Coupons" description="Discount codes customers can enter in their cart.">
            <Head title="Coupons" />
            <ShopCouponsManager coupons={shopCoupons} canManage={can('manage shop settings')} />
        </SectionWrapper>
    );
}
