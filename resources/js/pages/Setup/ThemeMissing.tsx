import React from 'react';
import { Head, Link } from '@inertiajs/react';

type Props = {
    message?: string;
};

export default function ThemeMissing({ message }: Props) {
    return (
        <>
            <Head title="Theme Setup Required" />
            <div className="min-h-screen bg-gray-50 text-gray-900">
                <div className="max-w-2xl mx-auto px-6 py-16">
                    <h1 className="text-3xl font-semibold">Theme setup required</h1>
                    <p className="mt-4 text-gray-700">
                        The public site is configured to use React themes only, but no active React theme was found.
                    </p>
                    {message ? (
                        <p className="mt-3 text-sm text-gray-600">{message}</p>
                    ) : null}

                    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
                        <h2 className="text-lg font-medium">Next steps</h2>
                        <ol className="mt-3 list-decimal pl-5 space-y-2 text-gray-700">
                            <li>Install discovered themes (dashboard or CLI).</li>
                            <li>Activate a React theme (e.g. <span className="font-mono">modern-react</span>).</li>
                            <li>Refresh this page.</li>
                        </ol>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-white"
                        >
                            Go to dashboard
                        </Link>
                        <a
                            href="/health"
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2"
                        >
                            Health
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
