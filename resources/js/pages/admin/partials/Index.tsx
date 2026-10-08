import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import AdminLayout from '@/layouts/admin-layout';
import { SectionWrapper } from '@/pages/dashboard/components/common/SectionWrapper';
import { Check, Copy, Search } from 'lucide-react';
import { useId, useRef, useState, type ReactNode } from 'react';
import { partialShortcode, type CatalogPartial } from './shortcode';

export function PartialCard({ partial }: { partial: CatalogPartial }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const [copyFailed, setCopyFailed] = useState(false);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const id = useId();
    const shortcode = partialShortcode(partial, t('dashboard.partials.body_placeholder'));
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(shortcode);
            setCopied(true);
            setCopyFailed(false);
        } catch {
            setCopied(false);
            setCopyFailed(true);
            textarea.current?.focus();
            textarea.current?.select();
        }
    };
    return (
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{partial.label}</CardTitle>
                <code className="text-sm text-muted-foreground">{partial.name}</code>
                {partial.description && <CardDescription>{partial.description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={id}>{t('dashboard.partials.shortcode')}</Label>
                    <Textarea ref={textarea} id={id} readOnly value={shortcode} rows={partial.body ? 3 : 2} className="font-mono text-sm" />
                    <Button type="button" variant="outline" onClick={copy}>
                        {copied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                        {t(copied ? 'dashboard.partials.copied' : 'dashboard.partials.copy')}
                    </Button>
                    <p role="status" className="text-sm text-muted-foreground">
                        {copyFailed ? t('dashboard.partials.copy_failed') : copied ? t('dashboard.partials.copied') : ''}
                    </p>
                </div>
                {Object.keys(partial.defaults).length > 0 && (
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">{t('dashboard.partials.attributes')}</h3>
                        <dl className="divide-y text-sm">
                            {Object.entries(partial.defaults).map(([name, value]) => (
                                <div key={name} className="flex flex-wrap justify-between gap-2 py-2">
                                    <dt className="font-mono">{name}</dt>
                                    <dd className="max-w-full break-all text-muted-foreground">{value || t('dashboard.partials.empty_value')}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function Partials({ partialCatalog, themeName }: { partialCatalog: CatalogPartial[]; themeName: string | null }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const matches = partialCatalog.filter((partial) =>
        `${partial.name} ${partial.label} ${partial.description}`.toLowerCase().includes(search.toLowerCase()),
    );
    return (
        <SectionWrapper title={t('dashboard.nav.partials')} description={t('dashboard.partials.description')}>
            <p className="mb-4 text-sm text-muted-foreground">
                {themeName ? `${t('dashboard.partials.active_theme')}: ${themeName}` : t('dashboard.partials.no_theme')}
            </p>
            <p className="mb-6 text-sm text-muted-foreground">{t('dashboard.partials.instructions')}</p>
            {partialCatalog.length > 0 ? (
                <>
                    <div className="relative mb-6 max-w-md">
                        <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                        <Input
                            aria-label={t('dashboard.partials.search')}
                            placeholder={t('dashboard.partials.search')}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="pl-9"
                        />
                    </div>
                    {matches.length > 0 ? (
                        <div className="grid items-start gap-6 lg:grid-cols-2">
                            {matches.map((partial) => (
                                <PartialCard key={partial.name} partial={partial} />
                            ))}
                        </div>
                    ) : (
                        <p>{t('dashboard.partials.no_results')}</p>
                    )}
                </>
            ) : (
                <p>{t('dashboard.partials.no_partials')}</p>
            )}
        </SectionWrapper>
    );
}

Partials.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
