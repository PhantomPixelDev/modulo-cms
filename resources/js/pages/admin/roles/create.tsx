import { Head, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Heading from '@/components/heading';
import { AppShell } from '@/components/app-shell';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Permission {
    id: number;
    name: string;
}

interface CreateRoleProps {
    permissions: Permission[];
}

export default function CreateRole({ permissions }: CreateRoleProps) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        permissions: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.roles.store'));
    };

    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionId]);
        } else {
            setData('permissions', data.permissions.filter(id => id !== permissionId));
        }
    };

    // Group permissions by category
    const groupedPermissions = permissions.reduce((groups, permission) => {
        const category = permission.name.split(' ')[1] || 'Other'; // e.g., "view users" -> "users"
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(permission);
        return groups;
    }, {} as Record<string, Permission[]>);

    return (
        <AppShell>
            <Head title="Create Role" />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.roles.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Roles
                        </Button>
                    </Link>
                    <Heading title="Create New Role" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Role Information</CardTitle>
                        <CardDescription>
                            Create a new role and assign permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter role name"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <Label>Permissions</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="space-y-3">
                                            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 capitalize">
                                                {category}
                                            </h4>
                                            <div className="space-y-2">
                                                {perms.map((permission) => (
                                                    <div key={permission.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`permission-${permission.id}`}
                                                            checked={data.permissions.includes(permission.id)}
                                                            onCheckedChange={(checked) => 
                                                                handlePermissionChange(permission.id, checked as boolean)
                                                            }
                                                        />
                                                        <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                                                            {permission.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4">
                                <Link href={route('admin.roles.index')}>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {processing ? 'Creating...' : 'Create Role'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
} 