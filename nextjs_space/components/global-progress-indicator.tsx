'use client';

import { useLoadingStore } from '@/lib/loading-store';

export default function GlobalProgressIndicator() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-blue-200 z-[9999] pointer-events-none overflow-hidden">
      <div 
        className="h-full bg-blue-500 absolute"
        style={{
          animation: 'progress 1.5s ease-in-out infinite',
        }}
      />
      <style jsx global>{`
        @keyframes progress {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 60%;
            left: 20%;
          }
          100% {
            width: 0%;
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
