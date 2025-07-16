import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
}

interface Props {
    users: {
        data: User[];
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
        title: 'Users',
        href: '/admin/users',
    },
];

export default function UsersIndex({ users }: Props) {
    const { delete: destroy } = useForm();

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            destroy(route('admin.users.destroy', userId));
        }
    };

    return (
        <AppShell>
            <Head title="Users Management" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Users Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">
                            Manage system users and their roles
                        </p>
                    </div>
                    <Link href="/admin/users/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Users className="h-5 w-5 mr-2" />
                            Users ({users.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium">Name</th>
                                        <th className="text-left py-3 px-4 font-medium">Email</th>
                                        <th className="text-left py-3 px-4 font-medium">Roles</th>
                                        <th className="text-left py-3 px-4 font-medium">Created</th>
                                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{user.name}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-gray-600 dark:text-gray-300">{user.email}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role) => (
                                                        <Badge key={role.id} variant="secondary">
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex space-x-2">
                                                    <Link href={`/admin/users/${user.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-sm text-gray-500">
                                    Showing {((users.current_page - 1) * users.per_page) + 1} to {Math.min(users.current_page * users.per_page, users.total)} of {users.total} results
                                </div>
                                <div className="flex space-x-2">
                                    {users.current_page > 1 && (
                                        <Link href={`/admin/users?page=${users.current_page - 1}`}>
                                            <Button variant="outline" size="sm">Previous</Button>
                                        </Link>
                                    )}
                                    {users.current_page < users.last_page && (
                                        <Link href={`/admin/users?page=${users.current_page + 1}`}>
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