interface LoadingSkeletonProps {
    lines?: number;
    className?: string;
    showAvatar?: boolean;
}

export default function LoadingSkeleton({ lines = 3, className = '', showAvatar = false }: LoadingSkeletonProps) {
    return (
        <div className={`animate-pulse ${className}`}>
            {showAvatar && (
                <div className="mb-4 flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-gray-300"></div>
                    <div className="flex-1">
                        <div className="mb-2 h-4 w-1/4 rounded bg-gray-300"></div>
                        <div className="h-3 w-1/6 rounded bg-gray-300"></div>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {Array.from({ length: lines }, (_, i) => (
                    <div
                        key={i}
                        className="h-4 rounded bg-gray-300"
                        style={{
                            width: i === lines - 1 ? '60%' : '100%',
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
}
