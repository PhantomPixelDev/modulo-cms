import { SectionWrapper, useAdminToast } from '@modulo/ui';
import { Head, router } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopSettingsForm } from '../components/ShopSettingsForm';

export default function Settings({ shopSettings }: { shopSettings?: Record<string, unknown> }) {
    const can = useCan();
    const toast = useAdminToast();

    return (
        <SectionWrapper title="Shop settings" description="Your store's name, currency, taxes, shipping and checkout.">
            <Head title="Shop settings" />
            <ShopSettingsForm
                settings={shopSettings || {}}
                canEdit={can('manage shop settings')}
                onSave={(data) =>
                    router.put(route('dashboard.admin.shop.settings.update'), data, {
                        preserveScroll: true,
                        onError: () => toast.error('The shop settings could not be saved. Check the highlighted fields.'),
                    })
                }
            />
        </SectionWrapper>
    );
}
