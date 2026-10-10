import type { ReactNode } from 'react';
import { AdminToastProvider } from './components/admin/AdminToastProvider';
import ErrorBoundary from './ErrorBoundary';

/** Keep the initial server and browser trees identical during hydration. */
export default function ApplicationProviders({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary>
            <AdminToastProvider>{children}</AdminToastProvider>
        </ErrorBoundary>
    );
}
