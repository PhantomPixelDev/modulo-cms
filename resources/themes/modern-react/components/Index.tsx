import { ArrowRight, Blocks, PenLine, ShieldCheck } from 'lucide-react';
import Layout from './Layout';
import PostCard from './partials/PostCard';
import { ButtonLink, Container, useThemeT } from './partials/ui';

interface IndexProps {
    posts?: {
        data: any[];
    };
    pagination?: any;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Index({ posts, site, theme, menus }: IndexProps) {
    const tt = useThemeT();
    const safeSite = site || { name: 'Modulo CMS', tagline: 'Modern Content Management System' };
    const recentPosts = Array.isArray(posts?.data) ? posts.data.slice(0, 3) : [];

    const features = [
        {
            icon: PenLine,
            title: tt('home.features.items.flexible.title', 'Flexible Content Types'),
            description: tt(
                'home.features.items.flexible.description',
                'Create custom post types and taxonomies to organize your content exactly how you need it.',
            ),
        },
        {
            icon: ShieldCheck,
            title: tt('home.features.items.roles.title', 'Role-Based Access'),
            description: tt(
                'home.features.items.roles.description',
                'Granular permissions system to control who can create, edit, and publish content.',
            ),
        },
        {
            icon: Blocks,
            title: tt('home.features.items.modern.title', 'Modern UI/UX'),
            description: tt(
                'home.features.items.modern.description',
                'Beautiful, responsive interface built with React, TypeScript, and Tailwind CSS.',
            ),
        },
    ];

    return (
        <Layout title={tt('home.title', 'Home')} description={safeSite?.tagline} site={safeSite} theme={theme} menus={menus} bare>
            {/* Hero */}
            <section className="relative overflow-hidden border-b">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [mask-image:linear-gradient(to_bottom,black,transparent_80%)] [background-size:24px_24px]"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent)]"
                />
                <Container className="relative py-24 text-center sm:py-32">
                    <div className="mx-auto max-w-3xl">
                        <p className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                            {tt('home.hero.badge', 'Free & open source CMS')}
                        </p>
                        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
                            {safeSite?.tagline || tt('home.hero.title', 'The content platform that ships with you.')}
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                            {safeSite?.description ||
                                tt('home.hero.tagline', 'A powerful, modern content management system built with Laravel and React.')}
                        </p>
                        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                            <ButtonLink href="/posts" size="lg">
                                {tt('home.hero.primary_cta', 'Browse Content')}
                                <ArrowRight />
                            </ButtonLink>
                            <ButtonLink href="/dashboard" variant="outline" size="lg">
                                {tt('home.hero.secondary_cta', 'Admin Dashboard')}
                            </ButtonLink>
                        </div>
                        <p className="mt-6 text-sm text-muted-foreground">
                            {tt('home.hero.trust', 'Open source · Self-host it · Free forever, no account needed')}
                        </p>
                    </div>
                </Container>
            </section>

            {/* Features */}
            <section className="py-16 sm:py-20">
                <Container>
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium text-primary">{tt('home.features.eyebrow', 'Why Modulo')}</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                            {tt('home.features.title', 'Powerful Features')}
                        </h2>
                    </div>
                    <div className="mt-12 grid gap-4 md:grid-cols-3">
                        {features.map(({ icon: Icon, title, description }, index) => (
                            <div key={title} className="flex flex-col rounded-2xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md">
                                <div className="flex items-center justify-between">
                                    <span className="flex size-11 items-center justify-center rounded-xl border bg-background text-foreground shadow-xs">
                                        <Icon className="size-5" />
                                    </span>
                                    <span className="text-xs font-semibold tracking-[0.2em] text-muted-foreground/60 tabular-nums">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 className="mt-5 font-semibold text-foreground">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* Demo accounts */}
            <section className="border-t py-16 sm:py-20">
                <Container>
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-medium text-primary">{tt('home.demo.eyebrow', 'Try it yourself')}</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                            {tt('home.demo.title', 'Log in with a demo account')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                            {tt(
                                'home.demo.description',
                                'This demo resets regularly and the passwords below are public on purpose. Pick a role and explore.',
                            )}
                        </p>
                    </div>
                    <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
                        {(
                            [
                                { key: 'admin', badge: tt('home.demo.roles.admin.label', 'Admin'), email: 'admin@example.com', password: 'admin123' },
                                {
                                    key: 'editor',
                                    badge: tt('home.demo.roles.editor.label', 'Editor'),
                                    email: 'editor@example.com',
                                    password: 'editor123',
                                },
                                { key: 'user', badge: tt('home.demo.roles.user.label', 'User'), email: 'user@example.com', password: 'user123' },
                            ] as const
                        ).map(({ key, badge, email, password }) => (
                            <div key={key} className="flex flex-col rounded-2xl border bg-card p-6 shadow-xs">
                                <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                    {badge}
                                </span>
                                <dl className="mt-4 space-y-2 text-sm">
                                    <div>
                                        <dt className="text-xs text-muted-foreground">{tt('home.demo.email', 'Email')}</dt>
                                        <dd className="mt-0.5 rounded-md bg-muted px-2 py-1 font-mono text-[13px] break-all text-foreground">
                                            {email}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-muted-foreground">{tt('home.demo.password', 'Password')}</dt>
                                        <dd className="mt-0.5 rounded-md bg-muted px-2 py-1 font-mono text-[13px] break-all text-foreground">
                                            {password}
                                        </dd>
                                    </div>
                                </dl>
                                <ButtonLink href="/login" variant="outline" size="sm" className="mt-5">
                                    {tt('home.demo.login', 'Log in')}
                                    <ArrowRight />
                                </ButtonLink>
                            </div>
                        ))}
                    </div>
                </Container>
            </section>

            {/* Latest posts */}
            {recentPosts.length > 0 && (
                <section className="border-t py-16 sm:py-20">
                    <Container>
                        <div className="mb-8 flex items-end justify-between gap-4">
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                {tt('home.latest.title', 'Latest Updates')}
                            </h2>
                            <ButtonLink href="/posts" variant="ghost" size="sm">
                                {tt('home.latest.view_all', 'View all')}
                                <ArrowRight />
                            </ButtonLink>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {recentPosts.map((post: any) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    </Container>
                </section>
            )}

            {/* Call to action */}
            <section className="pb-20">
                <Container>
                    <div className="flex flex-col gap-6 rounded-3xl bg-foreground p-8 text-background sm:p-12 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-semibold tracking-tight">{tt('home.cta.title', 'Ready to Get Started?')}</h2>
                            <p className="mt-2 text-background/70">
                                {tt(
                                    'home.cta.description',
                                    'Explore the admin dashboard to manage your content, or browse our documentation to learn more.',
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <ButtonLink href="/dashboard" className="bg-background text-foreground hover:bg-background/85">
                                {tt('home.cta.primary', 'Go to Dashboard')}
                            </ButtonLink>
                            <ButtonLink
                                href="https://github.com/PhantomPixelDev/modulo-cms"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outline"
                                className="border-background/20 bg-transparent text-background hover:bg-background/10"
                            >
                                {tt('home.cta.secondary', 'View on GitHub')}
                            </ButtonLink>
                        </div>
                    </div>
                </Container>
            </section>
        </Layout>
    );
}
