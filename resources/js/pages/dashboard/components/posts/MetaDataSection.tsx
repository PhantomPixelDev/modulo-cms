import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';

interface MetaDataSectionProps {
    metaData: Record<string, any>;
    onMetaDataChange: (data: Record<string, any>) => void;
}

/** Keys other inputs own; editing them here as text would break them. */
const MANAGED_KEYS = ['fields', 'noindex', 'og_image', 'canonical_url', 'meta_title', 'meta_description'];

export function MetaDataSection({ metaData, onMetaDataChange }: MetaDataSectionProps) {
    const { t } = useTranslation();
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (newKey.trim()) {
            onMetaDataChange({ ...metaData, [newKey.trim()]: newValue });
            setNewKey('');
            setNewValue('');
        }
    };

    const handleRemove = (key: string) => {
        const newMeta = { ...metaData };
        delete newMeta[key];
        onMetaDataChange(newMeta);
    };

    const handleUpdate = (oldKey: string, newKey: string, value: string) => {
        const newMeta = { ...metaData };
        if (oldKey !== newKey) {
            delete newMeta[oldKey];
        }
        newMeta[newKey] = value;
        onMetaDataChange(newMeta);
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{t('dashboard.posts.form.extra_data_hint')}</p>
            <div className="space-y-2">
                {Object.entries(metaData)
                    .filter(([key, value]) => !MANAGED_KEYS.includes(key) && (value === null || typeof value !== 'object'))
                    .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                        <Input value={key} onChange={(e) => handleUpdate(key, e.target.value, String(metaData[key]))} className="flex-1" />
                        <Input value={String(value)} onChange={(e) => handleUpdate(key, key, e.target.value)} className="flex-1" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(key)}
                            className="text-destructive hover:text-destructive"
                            aria-label={t('dashboard.settings.remove')}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Input placeholder={t('dashboard.posts.form.extra_key')} aria-label={t('dashboard.posts.form.extra_key')} value={newKey} onChange={(e) => setNewKey(e.target.value)} className="flex-1" />
                <Input
                    placeholder={t('dashboard.posts.form.extra_value')}
                    aria-label={t('dashboard.posts.form.extra_value')}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                        // Enter adds the pair; it must not submit the whole post
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAdd();
                        }
                    }}
                />
                <Button type="button" variant="outline" onClick={handleAdd}>
                    {t('common.actions.add')}
                </Button>
            </div>
        </div>
    );
}

export default MetaDataSection;
