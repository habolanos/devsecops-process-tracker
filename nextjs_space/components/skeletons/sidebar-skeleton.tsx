'use client';

export function SidebarSkeleton() {
  return (
    <div className="w-56 bg-gray-50 border-r border-gray-200 p-3 animate-pulse">
      {/* Header skeleton */}
      <div className="h-5 bg-gray-200 rounded w-16 mb-4" />
      
      {/* Phase items skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-2.5 rounded-lg bg-white border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div className="h-3.5 bg-gray-200 rounded flex-1" />
            </div>
            <div className="h-2 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SidebarSkeleton;
