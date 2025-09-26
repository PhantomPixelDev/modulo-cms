import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';
import { useAcl } from '@/lib/acl';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
}

interface Props {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin',
    },
    {
        title: 'Roles',
        href: '/admin/roles',
    },
];

export default function RolesIndex({ roles }: Props) {
    const { delete: destroy } = useForm();
    const { hasPermission, isAdmin } = useAcl();

    const handleDelete = (roleId: number) => {
        if (confirm('Are you sure you want to delete this role?')) {
            destroy(route('admin.roles.destroy', roleId));
        }
    };

    return (
        <AppShell>
            <Head title="Roles Management" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Roles Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Manage system roles and permissions
                        </p>
                    </div>
                    {(isAdmin() || hasPermission('create roles')) && (
                        <Link href="/admin/roles/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Role
                            </Button>
                        </Link>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            Roles ({roles.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">Role Name</th>
                                        <th className="text-left py-3 px-4 font-medium">Permissions</th>
                                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.data.map((role) => (
                                        <tr key={role.id} className="border-b hover:bg-accent dark:hover:bg-gray-800">
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{role.name}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {role.permissions.slice(0, 3).map((permission) => (
                                                        <Badge key={permission.id} variant="outline">
                                                            {permission.name}
                                                        </Badge>
                                                    ))}
                                                    {role.permissions.length > 3 && (
                                                        <Badge variant="outline">
                                                            +{role.permissions.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-2">
                                                    {(isAdmin() || hasPermission('edit roles')) && (
                                                        <Link href={`/admin/roles/${role.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {(isAdmin() || hasPermission('delete roles')) && role.name !== 'super-admin' && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDelete(role.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {roles.last_page > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-sm text-gray-500">
                                    Showing {((roles.current_page - 1) * roles.per_page) + 1} to {Math.min(roles.current_page * roles.per_page, roles.total)} of {roles.total} results
                                </div>
                                <div className="flex space-x-2">
                                    {roles.current_page > 1 && (
                                        <Link href={`/admin/roles?page=${roles.current_page - 1}`}>
                                            <Button variant="outline" size="sm">Previous</Button>
                                        </Link>
                                    )}
                                    {roles.current_page < roles.last_page && (
                                        <Link href={`/admin/roles?page=${roles.current_page + 1}`}>
                                            <Button variant="outline" size="sm">Next</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
} 