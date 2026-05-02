"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { DailyMetrics, MetricKey } from "@/types";

interface MetricsChartProps {
  clientId: string;
  startDate: string;
  endDate: string;
}

const METRIC_OPTIONS: { key: MetricKey; label: string }[] = [
  { key: "spend", label: "Ad Spend ($)" },
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Link Clicks" },
  { key: "cpc", label: "CPC ($)" },
  { key: "ctr", label: "CTR (%)" },
  { key: "leads", label: "Leads" },
  { key: "cpl", label: "CPL ($)" },
];

export function MetricsChart({ clientId, startDate, endDate }: MetricsChartProps) {
  const [metric, setMetric] = useState<MetricKey>("spend");
  const [data, setData] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ client: clientId, startDate, endDate });
      const res = await fetch(`/api/chart?${params}`);
      if (!res.ok) throw new Error("Failed to load chart data");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [clientId, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedLabel = METRIC_OPTIONS.find((m) => m.key === metric)?.label ?? metric;

  function formatValue(v: number): string {
    if (metric === "spend" || metric === "cpc" || metric === "cpl") return `$${v.toFixed(2)}`;
    if (metric === "ctr") return `${v.toFixed(2)}%`;
    return v.toFixed(2);
  }

  function formatDate(d: string): string {
    const date = new Date(d + "T00:00:00");
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Over Time</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          {METRIC_OPTIONS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-red-400 text-sm">{error}</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatValue(v)}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => [formatValue(Number(v ?? 0)), selectedLabel]}
              labelFormatter={(d) => formatDate(String(d ?? ""))}
              contentStyle={{
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
