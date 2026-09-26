import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';

const NONE = '__none';

/** Name, location, slug and note of a menu; shared by the create and edit forms. */
export function MenuFields({
    data,
    setData,
    errors,
    locations,
}: {
    data: { name: string; slug: string; location: string; description: string };
    setData: (key: 'name' | 'slug' | 'location' | 'description', value: string) => void;
    errors: Partial<Record<'name' | 'slug' | 'location' | 'description', string>>;
    locations: Record<string, string>;
}) {
    const { t } = useTranslation();
    const hasLocations = Object.keys(locations).length > 0;

    return (
        <>
            <div className="space-y-1.5">
                <Label htmlFor="menu-name">{t('dashboard.menus.fields.name')}</Label>
                <Input
                    id="menu-name"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    placeholder={t('dashboard.menus.fields.name_placeholder')}
                    required
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="menu-location">{t('dashboard.menus.fields.location')}</Label>
                {hasLocations ? (
                    <Select value={data.location || NONE} onValueChange={(value) => setData('location', value === NONE ? '' : value)}>
                        <SelectTrigger id="menu-location">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NONE}>{t('dashboard.menus.fields.location_none')}</SelectItem>
                            {Object.entries(locations).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                            {data.location && !locations[data.location] && <SelectItem value={data.location}>{data.location}</SelectItem>}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input id="menu-location" value={data.location} onChange={(event) => setData('location', event.target.value)} placeholder="header" />
                )}
                <p className="text-xs text-muted-foreground">{t('dashboard.menus.fields.location_hint')}</p>
                {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="menu-slug">{t('dashboard.menus.fields.slug')}</Label>
                <Input id="menu-slug" value={data.slug} onChange={(event) => setData('slug', event.target.value)} placeholder="main-navigation" required />
                <p className="text-xs text-muted-foreground">{t('dashboard.menus.fields.slug_hint')}</p>
                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="menu-description">{t('dashboard.menus.fields.description')}</Label>
                <Textarea
                    id="menu-description"
                    value={data.description}
                    onChange={(event) => setData('description', event.target.value)}
                    className="min-h-[70px]"
                />
                <p className="text-xs text-muted-foreground">{t('dashboard.menus.fields.description_hint')}</p>
            </div>
        </>
    );
}
