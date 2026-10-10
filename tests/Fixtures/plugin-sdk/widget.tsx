import { Head, WhenMounted } from '@inertiajs/react';
import { Button } from '@modulo/ui';
import { useState } from 'react';

// Independently compiled plugin fixture exercises the shared runtime imports,
// including an export introduced by Inertia 3.
export function Widget() {
    const [count, setCount] = useState(0);
    return (
        <>
            <Head title="SDK fixture" />
            <WhenMounted>
                <Button onClick={() => setCount(count + 1)}>{count}</Button>
            </WhenMounted>
        </>
    );
}
