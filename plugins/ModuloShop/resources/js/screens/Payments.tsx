import { SectionWrapper } from '@modulo/ui';
import { Head } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopPaymentsManager } from '../components/ShopPaymentsManager';
import type { ShopGateway } from '../types';

export default function Payments({ shopGateways }: { shopGateways?: ShopGateway[] }) {
    const can = useCan();

    return (
        <SectionWrapper title="Payments" description="Choose how customers can pay. Online methods send them to the provider's secure page.">
            <Head title="Payments" />
            <ShopPaymentsManager gateways={shopGateways ?? []} canManage={can('manage shop settings')} />
        </SectionWrapper>
    );
}
