import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Shield, Settings, Activity, User, Plus, Edit, Trash2, Eye, ArrowLeft, Save, FileText } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    roles: Array<{ id: number; name: string }>;
}

interface Role {
    id: number;
    name: string;
    permissions: Array<{ id: number; name: string }>;
}

interface Post {
    id: number;
    title: string;
    content: string;
    excerpt?: string;
    status: string;
    created_at: string;
    post_type: string;
    post_type_id: number;
    author?: {
        id: number;
        name: string;
    };
    taxonomy_terms: Array<{ id: number; name: string }>;
}

interface PostType {
    id: number;
    name: string;
    label: string;
    plural_label: string;
    description?: string;
    has_taxonomies: boolean;
    has_featured_image: boolean;
    has_excerpt: boolean;
    has_comments: boolean;
    supports: string[];
    taxonomies: string[];
    slug: string;
    is_public: boolean;
    is_hierarchical: boolean;
    menu_icon?: string;
    menu_position: number;
}

interface Taxonomy {
    id: number;
    name: string;
    label: string;
    plural_label: string;
    description?: string;
    slug: string;
    is_hierarchical: boolean;
    is_public: boolean;
    post_types: string[];
    show_in_menu: boolean;
    menu_icon?: string;
    menu_position: number;
}

interface TaxonomyTerm {
    id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    term_order: number;
    meta_title?: string;
    meta_description?: string;
    taxonomy?: Taxonomy;
}

interface DashboardProps {
    adminStats?: {
        users: number;
        roles: number;
        posts: number;
        postTypes: number;
        taxonomies: number;
        taxonomyTerms: number;
    };
    adminSection?: string;
    users?: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    roles?: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    posts?: {
        data: Post[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    taxonomies?: {
        data: Taxonomy[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    allRoles?: Role[];
    postTypes?: PostType[];
    permissions?: Array<{ id: number; name: string }>;
    editUser?: User;
    editRole?: Role;
    editPost?: Post;
    groupedTerms?: Record<string, TaxonomyTerm[]>;
}

export default function Dashboard({ adminStats, adminSection, users, roles, posts, taxonomies, allRoles, postTypes, permissions, editUser, editRole, editPost, groupedTerms }: DashboardProps) {
    const page = usePage();
    const user = (page.props as any).auth?.user;
    
    console.log('User data:', user); // Debug log
    console.log('Admin stats:', adminStats); // Debug log
    
    // Simple admin check
    const isAdmin = user?.roles?.some((role: any) => role.name === 'admin' || role.name === 'super-admin') || false;

    // Form for creating users
    const { data: userData, setData: setUserData, post: postUser, processing: userProcessing, errors: userErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[],
    });

    // Form for creating roles
    const { data: roleData, setData: setRoleData, post: postRole, processing: roleProcessing, errors: roleErrors } = useForm({
        name: '',
        permissions: [] as number[],
    });

    // Form for creating posts
    const { data: postData, setData: setPostData, post: postPost, processing: postProcessing, errors: postErrors } = useForm({
        post_type_id: '',
        title: '',
        content: '',
        excerpt: '',
        status: 'draft',
        featured_image: '',
        taxonomy_terms: [] as number[],
        meta_title: '',
        meta_description: '',
    });

    // Initialize form data for editing
    const [isEditing, setIsEditing] = useState(false);

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = editUser ? route('dashboard.admin.users.update', editUser.id) : route('dashboard.admin.users.store');
        const method = editUser ? 'put' : 'post';

        if (method === 'post') {
            postUser(url);
        } else {
            router.put(url, userData);
        }
    };

    const handleCreateRole = (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = editRole ? route('dashboard.admin.roles.update', editRole.id) : route('dashboard.admin.roles.store');
        const method = editRole ? 'put' : 'post';

        if (method === 'post') {
            postRole(url);
        } else {
            router.put(url, roleData);
        }
    };

    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        
        const url = editPost ? route('dashboard.admin.posts.update', editPost.id) : route('dashboard.admin.posts.store');
        const method = editPost ? 'put' : 'post';

        if (method === 'post') {
            postPost(url);
        } else {
            router.put(url, postData);
        }
    };

    const handleRoleChange = (roleId: number, checked: boolean) => {
        if (checked) {
            setUserData('roles', [...userData.roles, roleId]);
        } else {
            setUserData('roles', userData.roles.filter(id => id !== roleId));
        }
    };

    const handleTaxonomyTermChange = (termId: number, checked: boolean) => {
        if (checked) {
            setPostData('taxonomy_terms', [...postData.taxonomy_terms, termId]);
        } else {
            setPostData('taxonomy_terms', postData.taxonomy_terms.filter(id => id !== termId));
        }
    };

    // Render admin section content
    const renderAdminSection = () => {
        if (!adminSection) return null;

        switch (adminSection) {
            case 'users':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">User Management</h2>
                            <Link href={route('dashboard.admin.users.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add User
                                </Button>
                            </Link>
                        </div>
                        
                        <Card>
                            <CardContent className="p-0">
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
                                            {users?.data.map((user) => (
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
                                                            <Link href={route('dashboard.admin.users.edit', user.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'users.create':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('dashboard.admin.users.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Users
                                </Button>
                            </Link>
                            <h2 className="text-2xl font-bold">Create New User</h2>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={userData.name}
                                                onChange={(e) => setUserData('name', e.target.value)}
                                                required
                                            />
                                            {userErrors.name && (
                                                <p className="text-sm text-red-600">{userErrors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email}
                                                onChange={(e) => setUserData('email', e.target.value)}
                                                required
                                            />
                                            {userErrors.email && (
                                                <p className="text-sm text-red-600">{userErrors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={userData.password}
                                                onChange={(e) => setUserData('password', e.target.value)}
                                                required
                                            />
                                            {userErrors.password && (
                                                <p className="text-sm text-red-600">{userErrors.password}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                value={userData.password_confirmation}
                                                onChange={(e) => setUserData('password_confirmation', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Roles</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {allRoles?.map((role) => (
                                                <div key={role.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={userData.roles.includes(role.id)}
                                                        onCheckedChange={(checked) => 
                                                            handleRoleChange(role.id, checked as boolean)
                                                        }
                                                    />
                                                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                                                        {role.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <Link href={route('dashboard.admin.users.index')}>
                                            <Button variant="outline" type="button">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={userProcessing}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {userProcessing ? 'Creating...' : 'Create User'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'users.edit':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('dashboard.admin.users.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Users
                                </Button>
                            </Link>
                            <h2 className="text-2xl font-bold">Edit User: {editUser?.name}</h2>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={userData.name}
                                                onChange={(e) => setUserData('name', e.target.value)}
                                                required
                                            />
                                            {userErrors.name && (
                                                <p className="text-sm text-red-600">{userErrors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={userData.email}
                                                onChange={(e) => setUserData('email', e.target.value)}
                                                required
                                            />
                                            {userErrors.email && (
                                                <p className="text-sm text-red-600">{userErrors.email}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Roles</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {allRoles?.map((role) => (
                                                <div key={role.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={userData.roles.includes(role.id)}
                                                        onCheckedChange={(checked) => 
                                                            handleRoleChange(role.id, checked as boolean)
                                                        }
                                                    />
                                                    <Label htmlFor={`role-${role.id}`} className="text-sm">
                                                        {role.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <Link href={route('dashboard.admin.users.index')}>
                                            <Button variant="outline" type="button">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={userProcessing}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {userProcessing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'roles':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Role Management</h2>
                            <Link href={route('dashboard.admin.roles.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Role
                                </Button>
                            </Link>
                        </div>
                        
                        <Card>
                            <CardContent className="p-0">
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
                                            {roles?.data.map((role) => (
                                                <tr key={role.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
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
                                                            <Link href={route('dashboard.admin.roles.edit', role.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'posts':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Post Management</h2>
                            <Link href={route('dashboard.admin.posts.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Post
                                </Button>
                            </Link>
                        </div>
                        
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">Title</th>
                                                <th className="text-left py-3 px-4 font-medium">Type</th>
                                                <th className="text-left py-3 px-4 font-medium">Author</th>
                                                <th className="text-left py-3 px-4 font-medium">Status</th>
                                                <th className="text-left py-3 px-4 font-medium">Created</th>
                                                <th className="text-left py-3 px-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {posts?.data.map((post) => (
                                                <tr key={post.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{post.title}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline">{post.post_type}</Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-gray-600 dark:text-gray-300">{post.author?.name}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                                            {post.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(post.created_at).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <Link href={route('dashboard.admin.posts.edit', post.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'posts.create':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('dashboard.admin.posts.index')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Posts
                                </Button>
                            </Link>
                            <h2 className="text-2xl font-bold">Create New Post</h2>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Post Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCreatePost} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Title</Label>
                                            <Input
                                                id="title"
                                                value={postData.title}
                                                onChange={(e) => setPostData('title', e.target.value)}
                                                required
                                            />
                                            {postErrors.title && (
                                                <p className="text-sm text-red-600">{postErrors.title}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="post_type_id">Post Type</Label>
                                            <select
                                                id="post_type_id"
                                                value={postData.post_type_id}
                                                onChange={(e) => setPostData('post_type_id', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            >
                                                <option value="">Select Post Type</option>
                                                {postTypes?.map((postType) => (
                                                    <option key={postType.id} value={postType.id}>
                                                        {postType.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {postErrors.post_type_id && (
                                                <p className="text-sm text-red-600">{postErrors.post_type_id}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="excerpt">Excerpt</Label>
                                        <textarea
                                            id="excerpt"
                                            value={postData.excerpt}
                                            onChange={(e) => setPostData('excerpt', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {postErrors.excerpt && (
                                            <p className="text-sm text-red-600">{postErrors.excerpt}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="content">Content</Label>
                                        <textarea
                                            id="content"
                                            value={postData.content}
                                            onChange={(e) => setPostData('content', e.target.value)}
                                            rows={10}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {postErrors.content && (
                                            <p className="text-sm text-red-600">{postErrors.content}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <select
                                                id="status"
                                                value={postData.status}
                                                onChange={(e) => setPostData('status', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="draft">Draft</option>
                                                <option value="published">Published</option>
                                                <option value="private">Private</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="featured_image">Featured Image URL</Label>
                                            <Input
                                                id="featured_image"
                                                value={postData.featured_image}
                                                onChange={(e) => setPostData('featured_image', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {groupedTerms && Object.keys(groupedTerms).length > 0 && (
                                        <div className="space-y-4">
                                            <Label>Taxonomy Terms</Label>
                                            {Object.entries(groupedTerms).map(([taxonomyName, terms]) => (
                                                <div key={taxonomyName} className="space-y-2">
                                                    <h4 className="font-medium text-sm">{taxonomyName}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {terms.map((term) => (
                                                            <div key={term.id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`term-${term.id}`}
                                                                    checked={postData.taxonomy_terms.includes(term.id)}
                                                                    onCheckedChange={(checked) => 
                                                                        handleTaxonomyTermChange(term.id, checked as boolean)
                                                                    }
                                                                />
                                                                <Label htmlFor={`term-${term.id}`} className="text-sm">
                                                                    {term.name}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="meta_title">Meta Title</Label>
                                            <Input
                                                id="meta_title"
                                                value={postData.meta_title}
                                                onChange={(e) => setPostData('meta_title', e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="meta_description">Meta Description</Label>
                                            <textarea
                                                id="meta_description"
                                                value={postData.meta_description}
                                                onChange={(e) => setPostData('meta_description', e.target.value)}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <Link href={route('dashboard.admin.posts.index')}>
                                            <Button variant="outline" type="button">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={postProcessing}>
                                            <Save className="h-4 w-4 mr-2" />
                                            {postProcessing ? 'Creating...' : 'Create Post'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'post-types':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Post Type Management</h2>
                            <Link href={route('dashboard.admin.post-types.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Post Type
                                </Button>
                            </Link>
                        </div>
                        
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">Name</th>
                                                <th className="text-left py-3 px-4 font-medium">Label</th>
                                                <th className="text-left py-3 px-4 font-medium">Features</th>
                                                <th className="text-left py-3 px-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {postTypes?.map((postType) => (
                                                <tr key={postType.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{postType.name}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-gray-600 dark:text-gray-300">{postType.label}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {postType.supports.map((support) => (
                                                                <Badge key={support} variant="outline" className="text-xs">
                                                                    {support}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <Link href={route('dashboard.admin.post-types.edit', postType.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'taxonomies':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Taxonomy Management</h2>
                            <Link href={route('dashboard.admin.taxonomies.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Taxonomy
                                </Button>
                            </Link>
                        </div>
                        
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium">Name</th>
                                                <th className="text-left py-3 px-4 font-medium">Label</th>
                                                <th className="text-left py-3 px-4 font-medium">Type</th>
                                                <th className="text-left py-3 px-4 font-medium">Post Types</th>
                                                <th className="text-left py-3 px-4 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {taxonomies?.data?.map((taxonomy) => (
                                                <tr key={taxonomy.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{taxonomy.name}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-gray-600 dark:text-gray-300">{taxonomy.label}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant={taxonomy.is_hierarchical ? 'default' : 'secondary'}>
                                                            {taxonomy.is_hierarchical ? 'Hierarchical' : 'Flat'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-wrap gap-1">
                                                            {taxonomy.post_types.map((postType) => (
                                                                <Badge key={postType} variant="outline" className="text-xs">
                                                                    {postType}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex space-x-2">
                                                            <Link href={route('dashboard.admin.taxonomies.edit', taxonomy.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Welcome back, {user?.name || 'User'}!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                        {isAdmin ? 'Admin Dashboard - Manage your system' : 'Personal Dashboard - Manage your content'}
                    </p>
                </div>

                {isAdmin ? (
                    // Admin Dashboard Content
                    <>
                        {adminSection ? (
                            // Show admin section content
                            renderAdminSection()
                        ) : (
                            // Show main admin dashboard
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{adminStats?.users || 0}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Registered users
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{adminStats?.roles || 0}</div>
                                            <p className="text-xs text-muted-foreground">
                                                User roles
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{adminStats?.posts || 0}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Published content
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Post Types</CardTitle>
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{adminStats?.postTypes || 0}</div>
                                            <p className="text-xs text-muted-foreground">
                                                Content types
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>User Management</span>
                                                <Link href={route('dashboard.admin.users.index')}>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Manage Users
                                                    </Button>
                                                </Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {users?.data && users.data.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {users.data.slice(0, 5).map((user) => (
                                                            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div>
                                                                    <div className="font-medium">{user.name}</div>
                                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                                    <div className="flex gap-1 mt-1">
                                                                        {user.roles.map((role) => (
                                                                            <Badge key={role.id} variant="secondary" className="text-xs">
                                                                                {role.name}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Link href={route('dashboard.admin.users.edit', user.id)}>
                                                                        <Button variant="outline" size="sm">
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {users.total > 5 && (
                                                            <div className="text-center">
                                                                <Link href={route('dashboard.admin.users.index')}>
                                                                    <Button variant="outline" size="sm">
                                                                        View All Users ({users.total})
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">No users found</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>Role Management</span>
                                                <Link href={route('dashboard.admin.roles.index')}>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Manage Roles
                                                    </Button>
                                                </Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {roles?.data && roles.data.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {roles.data.slice(0, 5).map((role) => (
                                                            <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div>
                                                                    <div className="font-medium">{role.name}</div>
                                                                    <div className="flex gap-1 mt-1">
                                                                        {role.permissions.slice(0, 3).map((permission) => (
                                                                            <Badge key={permission.id} variant="outline" className="text-xs">
                                                                                {permission.name}
                                                                            </Badge>
                                                                        ))}
                                                                        {role.permissions.length > 3 && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                +{role.permissions.length - 3} more
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Link href={route('dashboard.admin.roles.edit', role.id)}>
                                                                        <Button variant="outline" size="sm">
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {roles.total > 5 && (
                                                            <div className="text-center">
                                                                <Link href={route('dashboard.admin.roles.index')}>
                                                                    <Button variant="outline" size="sm">
                                                                        View All Roles ({roles.total})
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">No roles found</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-between">
                                                <span>Content Management</span>
                                                <Link href={route('dashboard.admin.posts.index')}>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Manage Posts
                                                    </Button>
                                                </Link>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {posts?.data && posts.data.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {posts.data.slice(0, 5).map((post) => (
                                                            <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                                <div>
                                                                    <div className="font-medium">{post.title}</div>
                                                                    <div className="text-sm text-gray-500">{post.post_type}</div>
                                                                    <div className="flex gap-1 mt-1">
                                                                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                                                            {post.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Link href={route('dashboard.admin.posts.edit', post.id)}>
                                                                        <Button variant="outline" size="sm">
                                                                            <Edit className="h-3 w-3" />
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {posts.total > 5 && (
                                                            <div className="text-center">
                                                                <Link href={route('dashboard.admin.posts.index')}>
                                                                    <Button variant="outline" size="sm">
                                                                        View All Posts ({posts.total})
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 text-center py-4">No posts found</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    // Regular User Dashboard Content
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">My Content</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">12</div>
                                    <p className="text-xs text-muted-foreground">
                                        Published articles
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">3</div>
                                    <p className="text-xs text-muted-foreground">
                                        In progress
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Profile</CardTitle>
                                    <User className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Active</div>
                                    <p className="text-xs text-muted-foreground">
                                        Account verified
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <Link href="/settings/profile">
                                            <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                                <User className="h-5 w-5 mr-3 text-blue-600" />
                                                <div>
                                                    <div className="font-medium">Edit Profile</div>
                                                    <div className="text-sm text-gray-500">Update your personal information</div>
                                                </div>
                                            </div>
                                        </Link>
                                        
                                        <Link href="/settings/password">
                                            <div className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                                <Shield className="h-5 w-5 mr-3 text-green-600" />
                                                <div>
                                                    <div className="font-medium">Change Password</div>
                                                    <div className="text-sm text-gray-500">Update your account security</div>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Last login</span>
                                            <span className="text-sm text-gray-500">Today at 2:30 PM</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Profile updated</span>
                                            <span className="text-sm text-gray-500">Yesterday</span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Content published</span>
                                            <span className="text-sm text-gray-500">2 days ago</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
