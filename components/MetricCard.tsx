interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
}

export function MetricCard({ label, value, sub }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
