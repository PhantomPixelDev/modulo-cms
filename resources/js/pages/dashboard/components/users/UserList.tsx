import React, { useState, useMemo } from 'react';
import { ActionButtons } from '@/components/ui/table-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '../common/DataTable';
import { User } from '../../types';
import { router } from '@inertiajs/react';
import { ROUTE } from '../../routes';
import { Search, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type UserListProps = {
  users: User[];
  onEdit: (id: number) => void;
  onRoleChange?: (userId: number, roleId: number, action: 'assign' | 'remove') => void;
  currentUserId?: number;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManageRoles?: boolean;
};

export function UserList({
  users,
  onEdit,
  onRoleChange,
  currentUserId = -1,
  canEditUsers = false,
  canDeleteUsers = false,
  canManageRoles = false
}: UserListProps) {
  const { t } = useTranslation();
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Extract unique roles for filter options
  const roles = useMemo(() => {
    const uniqueRoles = new Map<number, string>();
    users.forEach(user => {
      (user.roles || []).forEach(role => {
        uniqueRoles.set(role.id, role.name);
      });
    });
    return Array.from(uniqueRoles, ([id, name]) => ({ id, name }));
  }, [users]);

  // Apply filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      
      // Role filter
      if (roleFilter !== 'all') {
        const hasRole = (user.roles || []).some(r => String(r.id) === roleFilter);
        if (!hasRole) return false;
      }
      
      return true;
    });
  }, [users, searchTerm, roleFilter]);

  const hasActiveFilters = roleFilter !== 'all' || searchTerm !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
  };

  const columns = [
    { key: 'name', label: t('dashboard.users.table.name'), sortable: true },
    { key: 'email', label: t('dashboard.users.table.email'), sortable: true },
    { key: 'roles', label: t('dashboard.users.table.roles'), sortable: false, render: (item: User) => (
      <div className="flex flex-wrap gap-1">
        {(item.roles || []).length === 0 ? (
          <span className="text-muted-foreground">{t('dashboard.users.table.none')}</span>
        ) : (
          (item.roles || []).map((r) => (
            <Badge key={r.id} variant="outline">{r.name}</Badge>
          ))
        )}
      </div>
    )},
    {
      key: 'created_at',
      label: t('dashboard.users.table.joined'),
      sortable: true,
      render: (item: User) => new Date(item.created_at ?? '').toLocaleDateString(),
    },
  ];

  const actions = (item: User) => (
    <div className="flex justify-end">
      <ActionButtons
        onEdit={canEditUsers ? () => onEdit(item.id) : undefined}
        onDelete={canDeleteUsers && item.id !== currentUserId ? () => {
          if (confirm(t('dashboard.users.confirm_delete'))) {
            router.delete(ROUTE.users.destroy(item.id));
          }
        } : undefined}
        showEdit={canEditUsers}
        showDelete={canDeleteUsers && item.id !== currentUserId}
        showView={false}
        size="sm"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('dashboard.users.filters.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* Role Filter */}
        {roles.length > 0 && (
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t('dashboard.users.filters.role_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard.users.filters.all_roles')}</SelectItem>
              {roles.map(role => (
                <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="h-4 w-4 mr-1" />
            {t('dashboard.users.filters.clear')}
          </Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {t('dashboard.users.filters.results', {
            shown: filteredUsers.length,
            total: users.length,
          })}
        </div>
      )}

      <DataTable
        data={filteredUsers}
        columns={columns}
        actions={actions}
        itemsPerPage={10}
        searchFields={[]}
      />
    </div>
  );
}
