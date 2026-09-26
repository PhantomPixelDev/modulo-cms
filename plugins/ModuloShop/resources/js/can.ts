import { useAcl } from '@modulo/ui';

/** Whether the signed-in user may do something; administrators always may. */
export function useCan(): (permission: string) => boolean {
    const { isAdmin, hasPermission } = useAcl();
    return (permission) => isAdmin() || hasPermission(permission);
}
