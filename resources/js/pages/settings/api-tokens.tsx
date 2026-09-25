import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/pages/dashboard/components/common/SettingsLayout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Copy, KeyRound, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'API tokens', href: '/settings/api-tokens' }];

interface Token {
    id: number;
    name: string;
    prefix: string;
    abilities: string[];
    last_used_at: string | null;
    expires_at: string | null;
    expired: boolean;
    created_at: string | null;
}

interface Props {
    tokens: Token[];
    plainTextToken: string | null;
    abilities: string[];
}

const ABILITY_HELP: Record<string, string> = {
    read: 'Read published content, and unpublished content you may see',
    write: 'Create, change and trash posts and pages you may edit',
};

export default function ApiTokens({ tokens, plainTextToken, abilities }: Props) {
    const form = useForm<{ name: string; abilities: string[]; expires_in_days: number | null }>({
        name: '',
        abilities: ['read'],
        expires_in_days: 90,
    });
    const [copied, setCopied] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('api-tokens.store'), { preserveScroll: true, onSuccess: () => form.reset('name') });
    };

    const toggle = (ability: string, on: boolean) =>
        form.setData('abilities', on ? [...new Set([...form.data.abilities, ability])] : form.data.abilities.filter((a) => a !== ability));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API tokens" />
            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall
                        title="API tokens"
                        description="Let other apps use the headless API (/api/v1) as you. A token can do at most what your account can."
                    />

                    {plainTextToken && (
                        <div className="space-y-2 rounded-lg border border-success/40 bg-success/10 p-4">
                            <p className="text-sm font-medium">Copy your new token now. It is not shown again.</p>
                            <div className="flex gap-2">
                                <code className="flex-1 overflow-x-auto rounded bg-background px-3 py-2 font-mono text-sm">{plainTextToken}</code>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(plainTextToken);
                                            setCopied(true);
                                        } catch {
                                            // Clipboard unavailable: it is on screen to copy by hand.
                                        }
                                    }}
                                >
                                    <Copy /> {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Send it as <code>Authorization: Bearer …</code>. See the API description at <code>/api/v1/openapi.json</code>.
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4 rounded-lg border p-5">
                        <div className="grid gap-2">
                            <Label htmlFor="token-name">Name</Label>
                            <Input
                                id="token-name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                                placeholder="e.g. Next.js front end"
                            />
                            <InputError message={form.errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Abilities</Label>
                            {abilities.map((ability) => (
                                <label key={ability} className="flex items-start gap-3">
                                    <Checkbox
                                        checked={form.data.abilities.includes(ability)}
                                        onCheckedChange={(checked) => toggle(ability, checked === true)}
                                    />
                                    <span className="text-sm">
                                        <span className="font-medium">{ability}</span>
                                        <span className="block text-xs text-muted-foreground">{ABILITY_HELP[ability]}</span>
                                    </span>
                                </label>
                            ))}
                            <InputError message={form.errors.abilities} />
                        </div>
                        <div className="grid max-w-xs gap-2">
                            <Label htmlFor="token-expiry">Expires</Label>
                            <select
                                id="token-expiry"
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                                value={form.data.expires_in_days ?? ''}
                                onChange={(e) => form.setData('expires_in_days', e.target.value === '' ? null : Number(e.target.value))}
                            >
                                <option value="7">In 7 days</option>
                                <option value="30">In 30 days</option>
                                <option value="90">In 90 days</option>
                                <option value="365">In a year</option>
                                <option value="">Never</option>
                            </select>
                        </div>
                        <Button disabled={form.processing || form.data.name.trim() === '' || form.data.abilities.length === 0}>
                            <KeyRound /> Create token
                        </Button>
                    </form>

                    <div className="space-y-2">
                        {tokens.length === 0 && <p className="text-sm text-muted-foreground">You have no API tokens.</p>}
                        {tokens.map((token) => (
                            <div key={token.id} className="flex items-center justify-between gap-4 rounded-lg border p-4">
                                <div className="min-w-0 space-y-1">
                                    <p className="flex flex-wrap items-center gap-2 font-medium">
                                        {token.name}
                                        {token.abilities.map((a) => (
                                            <Badge key={a} variant="outline">
                                                {a}
                                            </Badge>
                                        ))}
                                        {token.expired && <Badge variant="destructive">expired</Badge>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        <code>{token.prefix}…</code> · last used{' '}
                                        {token.last_used_at ? new Date(token.last_used_at).toLocaleString() : 'never'}
                                        {token.expires_at && ` · expires ${new Date(token.expires_at).toLocaleDateString()}`}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Revoke ${token.name}`}
                                    onClick={() => {
                                        if (window.confirm(`Revoke "${token.name}"? Apps using it stop working.`)) {
                                            router.delete(route('api-tokens.destroy', { id: token.id }), { preserveScroll: true });
                                        }
                                    }}
                                >
                                    <Trash2 className="text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
