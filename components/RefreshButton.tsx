"use client";

import { RefreshCw } from "lucide-react";
import { clsx } from "clsx";

interface RefreshButtonProps {
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
}

export function RefreshButton({ onRefresh, loading, lastUpdated }: RefreshButtonProps) {
  function formatTime(d: Date): string {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }

  return (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Updated {formatTime(lastUpdated)}
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        <RefreshCw size={15} className={clsx(loading && "animate-spin")} />
        Refresh
      </button>
    </div>
  );
}
