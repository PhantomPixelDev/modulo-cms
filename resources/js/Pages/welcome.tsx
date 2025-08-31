import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                    <div className="mb-8">
                        <h1 className="text-6xl font-bold text-gray-900 mb-4">
                            Modulo CMS
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Modern, modular content management system built with Laravel 12 and React 19
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-white rounded-lg p-6 shadow-lg">
                            <div className="text-blue-600 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Dynamic Post Types</h3>
                            <p className="text-gray-600">Create custom content types with configurable fields and templates</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-lg">
                            <div className="text-green-600 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Hybrid Themes</h3>
                            <p className="text-gray-600">Support for both Blade and React/TSX templates with Inertia.js</p>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-lg">
                            <div className="text-purple-600 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
                            <p className="text-gray-600">Fine-grained permissions with Spatie Laravel Permission</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="/dashboard"
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Go to Dashboard
                        </a>
                        <a
                            href="/posts"
                            className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
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
