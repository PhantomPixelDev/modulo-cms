import { SectionWrapper } from '@modulo/ui';
import { Head } from '@inertiajs/react';
import { useCan } from '../can';
import { ShopProductsManager } from '../components/ShopProductsManager';
import type { Paginated, ShopProduct } from '../types';

interface Props {
    shopProducts?: Paginated<ShopProduct>;
    productCategories?: { id: number; name: string }[];
    productTags?: { id: number; name: string }[];
    editProduct?: ShopProduct | null;
}

export default function Products({ shopProducts, productCategories, productTags, editProduct }: Props) {
    const can = useCan();

    return (
        <SectionWrapper title="Products" description="Manage your store products and inventory.">
            <Head title="Products" />
            <ShopProductsManager
                products={shopProducts}
                categories={productCategories ?? []}
                tags={productTags ?? []}
                initialEdit={editProduct ?? null}
                canView={can('view shop products')}
                canCreate={can('create shop products')}
                canEdit={can('edit shop products')}
                canDelete={can('delete shop products')}
            />
        </SectionWrapper>
    );
}
