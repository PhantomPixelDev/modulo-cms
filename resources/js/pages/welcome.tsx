import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="mx-auto max-w-4xl px-6 py-12 text-center">
                    <div className="mb-8">
                        <h1 className="mb-4 text-6xl font-bold text-gray-900">Modulo CMS</h1>
                        <p className="mb-8 text-xl text-gray-600">Modern, modular content management system built with Laravel 12 and React 19</p>
                    </div>

                    <div className="mb-12 grid gap-8 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 text-blue-600">
                                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Dynamic Post Types</h3>
                            <p className="text-gray-600">Create custom content types with configurable fields and templates</p>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 text-green-600">
                                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Hybrid Themes</h3>
                            <p className="text-gray-600">Support for both Blade and React/TSX templates with Inertia.js</p>
                        </div>

                        <div className="rounded-lg bg-white p-6 shadow-lg">
                            <div className="mb-4 text-purple-600">
                                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">Role-Based Access</h3>
                            <p className="text-gray-600">Fine-grained permissions with Spatie Laravel Permission</p>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <a
                            href="/dashboard"
                            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            Go to Dashboard
                        </a>
                        <a
                            href="/posts"
                            className="inline-flex items-center rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                            </svg>
                            View Posts
                        </a>
                    </div>

                    <div className="mt-12 text-sm text-gray-500">
                        <p>Built with Laravel 12, React 19, TypeScript, and Tailwind CSS</p>
                        <p className="mt-2">Powered by Bun for lightning-fast development</p>
                    </div>
                </div>
            </div>
        </>
    );
}
