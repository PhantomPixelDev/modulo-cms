import { Head } from '@inertiajs/react';

export default function Test() {
    return (
        <>
            <Head title="Test" />
            <div className="p-8">
                <h1 className="text-2xl font-bold">Test Page</h1>
                <p>If you can see this, the basic setup is working!</p>
            </div>
        </>
    );
} 