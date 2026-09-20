import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Requirement {
    name: string;
    passed: boolean;
    detail: string;
}

interface InstallProps {
    requirements: Requirement[];
    requirementsSatisfied: boolean;
    database: { connected: boolean; message: string };
    canConfigureDatabase: boolean;
    channel: 'docker' | 'tarball' | 'git';
    version: string;
    timezones: string[];
    [key: string]: unknown;
}

type StepId = 'requirements' | 'database' | 'administrator' | 'site' | 'done';

const STEPS: Array<{ id: StepId; label: string }> = [
    { id: 'requirements', label: 'Requirements' },
    { id: 'database', label: 'Database' },
    { id: 'administrator', label: 'Administrator' },
    { id: 'site', label: 'Your site' },
    { id: 'done', label: 'Finish' },
];

export default function Install() {
    const props = usePage<InstallProps>().props;
    const { requirements, requirementsSatisfied, database, channel, version, timezones } = props;

    const [step, setStep] = useState<StepId>(requirementsSatisfied ? 'database' : 'requirements');
    const [migrated, setMigrated] = useState(false);
    const [adminCreated, setAdminCreated] = useState(false);
    const [configured, setConfigured] = useState(false);
    const [busy, setBusy] = useState(false);

    const errors = (props.errors ?? {}) as Record<string, string>;
    const stepIndex = useMemo(() => STEPS.findIndex((s) => s.id === step), [step]);

    const admin = useForm({ name: '', email: '', password: '', password_confirmation: '' });
    const site = useForm({
        site_name: 'My Modulo Site',
        site_description: '',
        timezone: 'UTC',
        seed_demo_content: false as boolean,
    });

    const runMigrations = () => {
        setBusy(true);
        router.post(
            '/install/migrate',
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setMigrated(true);
                    setStep('administrator');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    const submitAdmin = () =>
        admin.post('/install/administrator', {
            preserveScroll: true,
            onSuccess: () => {
                setAdminCreated(true);
                setStep('site');
            },
        });

    const submitSite = () =>
        site.post('/install/configure', {
            preserveScroll: true,
            onSuccess: () => {
                setConfigured(true);
                setStep('done');
            },
        });

    const finish = () => {
        setBusy(true);
        router.post('/install/finish', {}, { onFinish: () => setBusy(false) });
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Head title="Install Modulo CMS" />

            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight">Install Modulo CMS</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Version {version} · {channel} install
                    </p>
                </header>

                <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Progress">
                    {STEPS.map((s, i) => (
                        <li
                            key={s.id}
                            aria-current={s.id === step ? 'step' : undefined}
                            className={i < stepIndex ? 'text-muted-foreground' : s.id === step ? 'font-medium' : 'text-muted-foreground/60'}
                        >
                            {i + 1}. {s.label}
                        </li>
                    ))}
                </ol>

                {errors.install ? (
                    <div
                        role="alert"
                        className="mb-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{errors.install}</span>
                    </div>
                ) : null}

                {step === 'requirements' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Requirements</CardTitle>
                            <CardDescription>Everything here must pass before the site can run.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="divide-y divide-border text-sm">
                                {requirements.map((req) => (
                                    <li key={req.name} className="flex items-center justify-between gap-4 py-2">
                                        <span className="flex items-center gap-2">
                                            {req.passed ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                                            ) : (
                                                <Circle className="h-4 w-4 text-destructive" aria-hidden />
                                            )}
                                            {req.name}
                                        </span>
                                        <span className="font-mono text-xs text-muted-foreground">{req.detail}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => router.reload()}>
                                    Re-check
                                </Button>
                                <Button disabled={!requirementsSatisfied} onClick={() => setStep('database')}>
                                    Continue
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 'database' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Database</CardTitle>
                            <CardDescription>
                                {channel === 'docker'
                                    ? 'Database settings come from your compose environment file.'
                                    : 'Database settings come from your .env file.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="flex items-center gap-2 text-sm">
                                {database.connected ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
                                )}
                                {database.message}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => router.reload()}>
                                    Re-check
                                </Button>
                                <Button disabled={!database.connected || busy} onClick={runMigrations}>
                                    {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {migrated ? 'Run again' : 'Create tables'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 'administrator' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Administrator account</CardTitle>
                            <CardDescription>This account gets full control of the site.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={admin.data.name} onChange={(e) => admin.setData('name', e.target.value)} />
                                {admin.errors.name ? <p className="text-xs text-destructive">{admin.errors.name}</p> : null}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="username"
                                    value={admin.data.email}
                                    onChange={(e) => admin.setData('email', e.target.value)}
                                />
                                {admin.errors.email ? <p className="text-xs text-destructive">{admin.errors.email}</p> : null}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={admin.data.password}
                                    onChange={(e) => admin.setData('password', e.target.value)}
                                />
                                {admin.errors.password ? <p className="text-xs text-destructive">{admin.errors.password}</p> : null}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">Confirm password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={admin.data.password_confirmation}
                                    onChange={(e) => admin.setData('password_confirmation', e.target.value)}
                                />
                            </div>
                            <Button disabled={admin.processing} onClick={submitAdmin}>
                                {admin.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Create account
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'site' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your site</CardTitle>
                            <CardDescription>You can change all of this later in Settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="site_name">Site name</Label>
                                <Input id="site_name" value={site.data.site_name} onChange={(e) => site.setData('site_name', e.target.value)} />
                                {site.errors.site_name ? <p className="text-xs text-destructive">{site.errors.site_name}</p> : null}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="site_description">Tagline</Label>
                                <Input
                                    id="site_description"
                                    value={site.data.site_description}
                                    onChange={(e) => site.setData('site_description', e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="timezone">Timezone</Label>
                                <select
                                    id="timezone"
                                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                    value={site.data.timezone}
                                    onChange={(e) => site.setData('timezone', e.target.value)}
                                >
                                    {timezones.map((tz) => (
                                        <option key={tz} value={tz}>
                                            {tz}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id="seed_demo_content"
                                    checked={site.data.seed_demo_content}
                                    onCheckedChange={(checked) => site.setData('seed_demo_content', checked === true)}
                                />
                                <Label htmlFor="seed_demo_content" className="text-sm leading-snug font-normal">
                                    Add sample content
                                    <span className="block text-xs text-muted-foreground">
                                        Creates example posts, pages and demo accounts with well-known passwords. Leave this off for a real site.
                                    </span>
                                </Label>
                            </div>
                            <Button disabled={site.processing} onClick={submitSite}>
                                {site.processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {step === 'done' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ready</CardTitle>
                            <CardDescription>{configured ? 'Your site is set up.' : 'Finish to close the installer.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">Finishing closes the installer for good. It will return 404 afterwards.</p>
                            <Button disabled={busy || !adminCreated} onClick={finish}>
                                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Finish and sign in
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
