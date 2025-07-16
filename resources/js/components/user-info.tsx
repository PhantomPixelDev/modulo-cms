import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
    const getInitials = useInitials();
    
    // Get the primary role (first role or 'user' as default)
    const primaryRole = user.roles?.[0]?.name || 'user';

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                        {primaryRole}
                    </Badge>
                    {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
                </div>
            </div>
        </>
    );
}
