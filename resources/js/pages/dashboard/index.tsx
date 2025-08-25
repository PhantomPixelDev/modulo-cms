 import { ReactNode } from 'react';
 import DashboardContent from './DashboardContent';
 import AdminLayout from '@/layouts/admin-layout';

const Dashboard = DashboardContent as unknown as typeof DashboardContent & {
  layout: (page: ReactNode) => ReactNode;
};

Dashboard.layout = (page: ReactNode) => (
  <AdminLayout title="Dashboard" breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }]}> 
    {page}
  </AdminLayout>
);

export default Dashboard;
