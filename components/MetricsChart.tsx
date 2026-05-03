"use client";

import { useState } from "react";
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
  externalData?: DailyMetrics[];
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

export function MetricsChart({ externalData = [] }: MetricsChartProps) {
  const [metric, setMetric] = useState<MetricKey>("spend");

  const selectedLabel = METRIC_OPTIONS.find((m) => m.key === metric)?.label ?? metric;

  function formatValue(v: number): string {
    if (metric === "spend" || metric === "cpc" || metric === "cpl") return `$${v.toFixed(2)}`;
    if (metric === "ctr") return `${v.toFixed(2)}%`;
    return v.toFixed(0);
  }

  function formatDate(d: string): string {
    const date = new Date(d + "T00:00:00");
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1c1c1c] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Performance Over Time</h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as MetricKey)}
          className="text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-lg px-2 py-1.5 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-[#ccc]"
        >
          {METRIC_OPTIONS.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
      </div>

      {externalData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={externalData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: "#555" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatValue(v)}
              tick={{ fontSize: 11, fill: "#555" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip
              formatter={(v) => [formatValue(Number(v ?? 0)), selectedLabel]}
              labelFormatter={(d) => formatDate(String(d ?? ""))}
              contentStyle={{
                background: "#111",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#ffffff"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: "#fff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
