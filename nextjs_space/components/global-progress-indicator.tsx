'use client';

import { useLoadingStore } from '@/lib/loading-store';

export default function GlobalProgressIndicator() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      {/* GitHub-style progress bar */}
      <div className="h-1 bg-blue-500 animate-progress" />
      
      <style jsx global>{`
        @keyframes progress {
          0% {
            width: 0%;
            left: 0%;
          }
          50% {
            width: 70%;
            left: 30%;
          }
          100% {
            width: 100%;
            left: 100%;
          }
        }
        
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
