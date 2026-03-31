'use client';

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Checkbox skeleton */}
        <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          
          {/* Description skeleton */}
          <div className="space-y-1.5 mb-3">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
          
          {/* Badge skeleton */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-100 rounded-full w-20" />
            <div className="h-6 bg-gray-100 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default TaskCardSkeleton;
