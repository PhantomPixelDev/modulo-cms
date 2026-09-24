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
                    className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [mask-image:linear-gradient(to_bottom,black,transparent)] [background-size:24px_24px]"
                />
                <Container className="relative py-20 sm:py-28">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">{safeSite?.name || 'Modulo CMS'}</h1>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                            {safeSite?.tagline ||
                                tt('home.hero.tagline', 'A powerful, modern content management system built with Laravel and React.')}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <ButtonLink href="/posts" size="lg">
                                {tt('home.hero.primary_cta', 'Browse Content')}
                                <ArrowRight />
                            </ButtonLink>
                            <ButtonLink href="/dashboard" variant="outline" size="lg">
                                {tt('home.hero.secondary_cta', 'Admin Dashboard')}
                            </ButtonLink>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Features */}
            <section className="py-16 sm:py-20">
                <Container>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {tt('home.features.title', 'Powerful Features')}
                    </h2>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="rounded-xl border bg-card p-6 shadow-xs">
                                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="font-semibold text-foreground">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
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
                    <div className="flex flex-col gap-6 rounded-2xl border bg-muted/40 p-8 sm:p-12 md:flex-row md:items-center md:justify-between">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{tt('home.cta.title', 'Ready to Get Started?')}</h2>
                            <p className="mt-2 text-muted-foreground">
                                {tt(
                                    'home.cta.description',
                                    'Explore the admin dashboard to manage your content, or browse our documentation to learn more.',
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <ButtonLink href="/dashboard">{tt('home.cta.primary', 'Go to Dashboard')}</ButtonLink>
                            <ButtonLink
                                href="https://github.com/PhantomPixelDev/modulo-cms"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outline"
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
