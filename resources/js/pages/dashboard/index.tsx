import AdminLayout from '@/layouts/admin-layout';
import { ReactNode } from 'react';
import DashboardContent from './DashboardContent';

const Dashboard = DashboardContent as unknown as typeof DashboardContent & {
    layout: (page: ReactNode) => ReactNode;
};

Dashboard.layout = (page: ReactNode) => (
    <AdminLayout title="Dashboard" breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
        {page}
    </AdminLayout>
);

export default Dashboard;
