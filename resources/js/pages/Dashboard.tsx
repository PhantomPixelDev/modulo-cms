import { ReactNode } from 'react';
import DashboardContent from './dashboard/DashboardContent';
import AdminLayout from '@/layouts/admin-layout';

// Attach layout so Inertia wraps this page with the admin shell (sidebar, header, logo)
const Dashboard = DashboardContent as unknown as typeof DashboardContent & {
  layout: (page: ReactNode) => ReactNode;
};

Dashboard.layout = (page: ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}>
    {page}
  </AdminLayout>
);

export default Dashboard;
