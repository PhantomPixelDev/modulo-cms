import ErrorBoundary from '@/ErrorBoundary';
import { useTranslation } from '@/hooks/useTranslation';
import { lazy, Suspense } from 'react';
import { ROUTE } from './routes';
import { renderDashboardHome } from './sections/home/homeSection';
import type { DashboardProps } from './types';

const DashboardSections = lazy(() => import('./DashboardSections'));

export default function DashboardContent(props: DashboardProps) {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-background">
            <ErrorBoundary>
                {props.adminSection ? (
                    <Suspense
                        fallback={
                            <div role="status" className="p-6">
                                {t('dashboard.common.loading')}
                            </div>
                        }
                    >
                        <DashboardSections {...props} />
                    </Suspense>
                ) : (
                    renderDashboardHome({
                        auth: props.auth,
                        adminStats: props.adminStats,
                        systemStatus: props.systemStatus,
                        overview: props.overview,
                        ROUTE,
                        t,
                    })
                )}
            </ErrorBoundary>
        </div>
    );
}
