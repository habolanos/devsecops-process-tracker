'use client';

export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-pulse">
        {/* Header skeleton */}
        <div className="p-6 border-b border-gray-200">
          <div className="h-7 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
        </div>
        
        {/* Content skeleton */}
        <div className="p-6 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-32 bg-gray-100 rounded" />
          
          <div className="h-4 bg-gray-200 rounded w-1/4 mt-6" />
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-100 rounded-lg" />
            <div className="flex-1 h-12 bg-gray-100 rounded-lg" />
          </div>
        </div>
        
        {/* Footer skeleton */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <div className="h-10 w-24 bg-gray-100 rounded-lg" />
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default ModalSkeleton;
