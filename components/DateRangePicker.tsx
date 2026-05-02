"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastMonthRange(): DateRange {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return {
    startDate: first.toISOString().split("T")[0],
    endDate: last.toISOString().split("T")[0],
  };
}

const PRESETS = [
  { label: "Today", range: () => ({ startDate: today(), endDate: today() }) },
  { label: "Last 7 days", range: () => ({ startDate: daysAgo(6), endDate: today() }) },
  { label: "Last 30 days", range: () => ({ startDate: daysAgo(29), endDate: today() }) },
  { label: "This month", range: () => ({ startDate: monthStart(), endDate: today() }) },
  { label: "Last month", range: () => lastMonthRange() },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <CalendarDays size={15} />
        <span>
          {value.startDate === value.endDate
            ? value.startDate
            : `${value.startDate} → ${value.endDate}`}
        </span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 min-w-[200px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { onChange(p.range()); setOpen(false); setCustom(false); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {p.label}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
            <button
              onClick={() => setCustom(!custom)}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              Custom range
            </button>
            {custom && (
              <div className="px-3 py-2 space-y-2">
                <div>
                  <label className="text-xs text-gray-400 dark:text-gray-500">From</label>
                  <input
                    type="date"
                    value={value.startDate}
                    max={value.endDate}
                    onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-gray-500">To</label>
                  <input
                    type="date"
                    value={value.endDate}
                    min={value.startDate}
                    max={today()}
                    onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full px-2 py-1 text-sm bg-black dark:bg-white text-white dark:text-black rounded-lg"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
