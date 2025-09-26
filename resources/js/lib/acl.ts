import { usePage } from '@inertiajs/react';

export type AclRole = { id: number; name: string };
export type AclPermission = { id: number; name: string };
export type AclUser = {
  id: number;
  name: string;
  email: string;
  roles: AclRole[];
  permissions: AclPermission[];
} | null;

export type AclContext = {
  user: AclUser;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasPermission: (perm: string) => boolean;
  canAny: (perms: string[]) => boolean;
  canAll: (perms: string[]) => boolean;
  isAdmin: () => boolean; // admin or super-admin
};

export function useAcl(): AclContext {
  const page = usePage<{ auth: { user: AclUser } }>();
  const user = page.props.auth?.user ?? null;
  const roleSet = new Set((user?.roles ?? []).map((r) => r.name));
  const permSet = new Set((user?.permissions ?? []).map((p) => p.name));

  const hasRole = (role: string) => roleSet.has(role);
  const hasAnyRole = (roles: string[]) => roles.some((r) => roleSet.has(r));
  const hasAllRoles = (roles: string[]) => roles.every((r) => roleSet.has(r));
  const hasPermission = (perm: string) => permSet.has(perm);
  const canAny = (perms: string[]) => perms.some((p) => permSet.has(p));
  const canAll = (perms: string[]) => perms.every((p) => permSet.has(p));
  const isAdmin = () => hasAnyRole(['admin', 'super-admin']);

  return { user, hasRole, hasAnyRole, hasAllRoles, hasPermission, canAny, canAll, isAdmin };
}

// Non-hook helpers for places where hooks are not available
export function hasPermissionFrom(user: AclUser, perm: string): boolean {
  const permSet = new Set((user?.permissions ?? []).map((p) => p.name));
  return permSet.has(perm);
}
export function canAnyFrom(user: AclUser, perms: string[]): boolean {
  const permSet = new Set((user?.permissions ?? []).map((p) => p.name));
  return perms.some((p) => permSet.has(p));
}
export function hasRoleFrom(user: AclUser, role: string): boolean {
  const roleSet = new Set((user?.roles ?? []).map((r) => r.name));
  return roleSet.has(role);
}
export function hasAnyRoleFrom(user: AclUser, roles: string[]): boolean {
  const roleSet = new Set((user?.roles ?? []).map((r) => r.name));
  return roles.some((r) => roleSet.has(r));
}
