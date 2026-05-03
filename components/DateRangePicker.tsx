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

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastMonthRange(): DateRange {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return { startDate: localDate(first), endDate: localDate(last) };
}

const PRESETS = [
  { label: "Today", range: () => ({ startDate: localDate(), endDate: localDate() }) },
  { label: "Last 7 days", range: () => ({ startDate: daysAgo(6), endDate: localDate() }) },
  { label: "Last 30 days", range: () => ({ startDate: daysAgo(29), endDate: localDate() }) },
  { label: "This month", range: () => ({ startDate: monthStart(), endDate: localDate() }) },
  { label: "Last month", range: () => lastMonthRange() },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#111] text-gray-700 dark:text-[#ccc] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
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
          <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2a2a2a] rounded-xl shadow-lg p-2 min-w-[200px]">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => { onChange(p.range()); setOpen(false); setCustom(false); }}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-[#ccc] transition-colors"
              >
                {p.label}
              </button>
            ))}
            <div className="border-t border-gray-100 dark:border-[#2a2a2a] my-1" />
            <button
              onClick={() => setCustom(!custom)}
              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-[#ccc] transition-colors"
            >
              Custom range
            </button>
            {custom && (
              <div className="px-3 py-2 space-y-2">
                <div>
                  <label className="text-xs text-gray-400 dark:text-[#555]">From</label>
                  <input
                    type="date"
                    value={value.startDate}
                    max={value.endDate}
                    onChange={(e) => onChange({ ...value, startDate: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-[#555]">To</label>
                  <input
                    type="date"
                    value={value.endDate}
                    min={value.startDate}
                    max={localDate()}
                    onChange={(e) => onChange({ ...value, endDate: e.target.value })}
                    className="w-full mt-1 px-2 py-1 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white"
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
