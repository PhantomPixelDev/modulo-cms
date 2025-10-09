import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  showAvatar?: boolean;
}

export default function LoadingSkeleton({
  lines = 3,
  className = '',
  showAvatar = false
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/6"></div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded" style={{
            width: i === lines - 1 ? '60%' : '100%'
          }}></div>
        ))}
      </div>
    </div>
  );
}
