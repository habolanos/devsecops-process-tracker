'use client';

import { useLoadingStore } from '@/lib/loading-store';

export default function GlobalProgressIndicator() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  
  console.log('GlobalProgressIndicator - isLoading:', isLoading);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 bg-blue-500 z-[9999] pointer-events-none">
      <div className="h-full bg-blue-400 animate-[progress_1.5s_ease-in-out_infinite]" />
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
      `}</style>
    </div>
  );
}
