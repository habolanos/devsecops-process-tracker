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
    <div data-testid="progress-bar" className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-bold text-foreground whitespace-nowrap">{percentage}%</span>
    </div>
  );
}
