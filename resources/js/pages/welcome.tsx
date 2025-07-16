import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { 
    Code, 
    Palette, 
    Zap, 
    Shield, 
    Users, 
    Globe, 
    ArrowRight, 
    Star,
    Github,
    BookOpen,
    Download,
    CheckCircle
} from 'lucide-react';
import AppLogo from '@/components/app-logo';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: Code,
            title: "Modular Architecture",
            description: "Plugin-based system for easy extensibility and customization"
        },
        {
            icon: Palette,
            title: "Modern UI",
            description: "Beautiful, responsive design with dark/light mode support"
        },
        {
            icon: Zap,
            title: "Fast Performance",
            description: "Built with Laravel 12 and React 19 for optimal speed"
        },
        {
            icon: Shield,
            title: "Secure by Default",
            description: "Complete authentication system with email verification"
        },
        {
            icon: Users,
            title: "User Management",
            description: "Advanced user roles, permissions, and profile management"
        },
        {
            icon: Globe,
            title: "Multi-site Ready",
            description: "Designed to scale from single site to multi-tenant"
        }
    ];

    const techStack = [
        { name: "Laravel 12", category: "Backend" },
        { name: "React 19", category: "Frontend" },
        { name: "TypeScript", category: "Frontend" },
        { name: "Tailwind CSS 4", category: "Styling" },
        { name: "Inertia.js", category: "Framework" },
        { name: "PHP 8.4", category: "Backend" },
        { name: "Pest PHP", category: "Testing" },
        { name: "Vite", category: "Build Tool" }
    ];

    return (
        <>
            <Head title="Modulo CMS - Modern Content Management System">
                <meta name="description" content="A modern, modular Content Management System built with Laravel 12 and React 19, featuring plugin-based architecture and developer-friendly design." />
            </Head>
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                {/* Navigation */}
                <nav className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <AppLogo />
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                    >
                                        Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                                        >
                                            Log in
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                        >
                                            Get Started
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <div className="relative overflow-hidden">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="py-24 sm:py-32">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-white">
                                    Modern Content Management
                                    <span className="block text-blue-600">Built for Developers</span>
                                </h1>
                                <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                                    A powerful, modular CMS built on Laravel 12 and React 19. 
                                    Featuring plugin-based architecture, modern UI components, 
                                    and everything you need to build amazing websites.
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-x-6">
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                    >
                                        Start Building
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="https://github.com/your-username/modulo-cms"
                                        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                                    >
                                        <Github className="mr-2 h-5 w-5" />
                                        View on GitHub
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="bg-white py-16 sm:py-24 dark:bg-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">100%</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Open Source</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">50+</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Built-in Components</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">∞</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Plugin Possibilities</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">24/7</div>
                                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Community Support</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Everything you need to build amazing websites
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Modulo CMS comes with all the features you need to create, manage, and scale your content.
                            </p>
                        </div>
                        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                                {features.map((feature) => (
                                    <div key={feature.title} className="flex flex-col">
                                        <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-slate-900 dark:text-white">
                                            <feature.icon className="h-5 w-5 flex-none text-blue-600" aria-hidden="true" />
                                            {feature.title}
                                        </dt>
                                        <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-600 dark:text-slate-300">
                                            <p className="flex-auto">{feature.description}</p>
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Demo Section */}
                <div className="bg-white py-24 sm:py-32 dark:bg-slate-800">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                See it in action
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Experience the power of Modulo CMS with our interactive demo.
                            </p>
                        </div>
                        <div className="mt-16 mx-auto max-w-5xl">
                            <div className="relative rounded-xl bg-slate-900 p-8 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div className="text-sm text-slate-400">modulo-cms.local</div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-6 text-center">
                                    <div className="text-slate-400 text-sm mb-4">Dashboard Preview</div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-slate-700 rounded p-4">
                                            <div className="text-blue-400 text-lg font-semibold">1,234</div>
                                            <div className="text-slate-400 text-sm">Total Users</div>
                                        </div>
                                        <div className="bg-slate-700 rounded p-4">
                                            <div className="text-green-400 text-lg font-semibold">567</div>
                                            <div className="text-slate-400 text-sm">Published Posts</div>
                                        </div>
                                        <div className="bg-slate-700 rounded p-4">
                                            <div className="text-purple-400 text-lg font-semibold">89</div>
                                            <div className="text-slate-400 text-sm">Active Plugins</div>
                                        </div>
                                    </div>
                                    <div className="text-slate-300 text-sm">
                                        Modern dashboard with real-time analytics and plugin management
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tech Stack Section */}
                <div className="bg-slate-50 py-24 sm:py-32 dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                Built with modern technologies
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Leverage the latest and greatest tools in web development.
                            </p>
                        </div>
                        <div className="mx-auto mt-16 grid max-w-lg grid-cols-2 gap-8 sm:mt-20 sm:max-w-xl sm:grid-cols-3 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-4">
                            {techStack.map((tech) => (
                                <div key={tech.name} className="flex flex-col items-center">
                                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {tech.category}
                                    </div>
                                    <div className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                                        {tech.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-blue-600 py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                Ready to get started?
                            </h2>
                            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
                                Join thousands of developers building amazing websites with Modulo CMS.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link
                                    href="https://github.com/your-username/modulo-cms"
                                    className="inline-flex items-center rounded-lg border border-transparent px-6 py-3 text-base font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    <Github className="mr-2 h-5 w-5" />
                                    Star on GitHub
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-slate-900">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="py-12">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="col-span-1 md:col-span-2">
                                    <h3 className="text-lg font-semibold text-white">Modulo CMS</h3>
                                    <p className="mt-4 text-sm text-slate-400">
                                        A modern, modular Content Management System built with Laravel 12 and React 19, 
                                        featuring plugin-based architecture and developer-friendly design.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Resources</h4>
                                    <ul className="mt-4 space-y-2">
                                        <li>
                                            <Link href="/docs" className="text-sm text-slate-400 hover:text-white">
                                                Documentation
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/plugins" className="text-sm text-slate-400 hover:text-white">
                                                Plugin Guide
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/roadmap" className="text-sm text-slate-400 hover:text-white">
                                                Roadmap
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Community</h4>
                                    <ul className="mt-4 space-y-2">
                                        <li>
                                            <Link href="https://github.com/your-username/modulo-cms" className="text-sm text-slate-400 hover:text-white">
                                                GitHub
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/discussions" className="text-sm text-slate-400 hover:text-white">
                                                Discussions
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/support" className="text-sm text-slate-400 hover:text-white">
                                                Support
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-8 border-t border-slate-800 pt-8">
                                <p className="text-sm text-slate-400">
                                    © 2024 Modulo CMS. Built with ❤️ using Laravel and React.
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
