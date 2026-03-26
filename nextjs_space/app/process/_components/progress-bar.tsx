'use client';

interface ProgressBarProps {
  progress: number;
  label: string;
  variant?: 'primary' | 'secondary';
}

export default function ProgressBar({ progress, label, variant = 'primary' }: ProgressBarProps) {
  const percentage = Math.round((progress ?? 0) * 100);
  const colorClass = variant === 'primary' ? 'bg-blue-500' : 'bg-indigo-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
