"use client";

import { Sparklines, SparklinesLine, SparklinesReferenceLine } from "react-sparklines";

interface MetricCardProps {
  label: string;
  value: string;
  sparkData?: number[];
  positive?: boolean;
}

export function MetricCard({ label, value, sparkData, positive = true }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1c1c1c] rounded-xl p-4 flex flex-col gap-2">
      <p className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
      {sparkData && sparkData.length > 1 && (
        <div className="h-8 mt-1">
          <Sparklines data={sparkData} margin={2}>
            <SparklinesLine
              color={positive ? "#22c55e" : "#ef4444"}
              style={{ strokeWidth: 1.5, fill: "none" }}
            />
          </Sparklines>
        </div>
      )}
    </div>
  );
}
