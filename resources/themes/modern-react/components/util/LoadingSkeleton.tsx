import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
    lines?: number;
    className?: string;
    showAvatar?: boolean;
}

export default function LoadingSkeleton({ lines = 3, className = '', showAvatar = false }: LoadingSkeletonProps) {
    return (
        <div className={cn('animate-pulse', className)} aria-hidden="true">
            {showAvatar && (
                <div className="mb-4 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/4 rounded bg-muted" />
                        <div className="h-3 w-1/6 rounded bg-muted" />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {Array.from({ length: lines }, (_, i) => (
                    <div key={i} className={cn('h-4 rounded bg-muted', i === lines - 1 ? 'w-3/5' : 'w-full')} />
                ))}
            </div>
        </div>
    );
}
