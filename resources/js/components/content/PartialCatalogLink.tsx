import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Boxes } from 'lucide-react';

export function PartialCatalogLink() {
    const { t } = useTranslation();
    return (
        <Button asChild variant="outline" size="sm">
            <a href="/dashboard/admin/partials" target="_blank" rel="noopener noreferrer">
                <Boxes className="mr-2 size-4" />
                {t('dashboard.partials.browse')}
            </a>
        </Button>
    );
}
