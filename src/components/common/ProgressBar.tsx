interface ProgressBarProps {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-base">
          <span className="text-ink/70">{label}</span>
          <span className="font-semibold text-workshop-500">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 w-full overflow-hidden rounded-full bg-workshop-50"
      >
        <div
          className="h-full rounded-full bg-sprout-500 transition-[width] duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
