import { Head } from '@inertiajs/react';

export default function Test() {
    return (
        <>
            <Head title="Test" />
            <div className="p-8">
                <h1 className="text-xl font-semibold tracking-tight">Test Page</h1>
                <p>If you can see this, the basic setup is working!</p>
            </div>
        </>
    );
} 