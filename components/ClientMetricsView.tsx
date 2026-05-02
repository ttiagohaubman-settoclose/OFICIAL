"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ClientMetrics, DateRange } from "@/types";
import { MetricCard } from "./MetricCard";
import { MetricsChart } from "./MetricsChart";
import { DateRangePicker } from "./DateRangePicker";
import { RefreshButton } from "./RefreshButton";
import { REFRESH_INTERVAL_MS, formatCurrency, formatNumber, formatPercent } from "@/lib/config";

interface ClientMetricsViewProps {
  clientId: string;
  title: string;
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function ClientMetricsView({ clientId, title }: ClientMetricsViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: monthStart(),
    endDate: todayStr(),
  });
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client: clientId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/metrics?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json: ClientMetrics[] = await res.json();
      setMetrics(json[0] ?? null);
      setLastUpdated(new Date());
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMetrics]);

  const meta = metrics?.meta;
  const ghl = metrics?.ghl;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {metrics?.client && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{metrics.client.state}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <RefreshButton onRefresh={fetchMetrics} loading={loading} lastUpdated={lastUpdated} />
        </div>
      </div>

      {metrics?.error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
          {metrics.error}
        </div>
      )}

      {/* Meta Ads Section */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Meta Ads
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard label="Ad Spend" value={meta ? formatCurrency(meta.spend) : "—"} />
          <MetricCard label="Impressions" value={meta ? formatNumber(meta.impressions, 0) : "—"} />
          <MetricCard label="Link Clicks" value={meta ? formatNumber(meta.clicks, 0) : "—"} />
          <MetricCard label="CPC" value={meta ? formatCurrency(meta.cpc) : "—"} />
          <MetricCard label="CTR" value={meta ? formatPercent(meta.ctr) : "—"} />
          <MetricCard label="Leads" value={meta ? formatNumber(meta.leads, 0) : "—"} />
          <MetricCard label="CPL" value={meta ? formatCurrency(meta.cpl) : "—"} />
        </div>
      </div>

      {/* GHL Section */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Pipeline (GoHighLevel)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MetricCard label="Citas Agendadas" value={ghl ? formatNumber(ghl.citasAgendadas, 0) : "—"} />
          <MetricCard label="Show Rate" value={ghl ? formatPercent(ghl.showRate) : "—"} />
          <MetricCard label="Deals Closed" value={ghl ? formatNumber(ghl.dealsClosed, 0) : "—"} />
          <MetricCard label="Close Rate" value={ghl ? formatPercent(ghl.closeRate) : "—"} />
          <MetricCard label="Revenue" value={ghl ? formatCurrency(ghl.revenue) : "—"} />
          <MetricCard label="Cash Collected" value={ghl ? formatCurrency(ghl.cashCollected) : "—"} />
          <MetricCard
            label="ROAS"
            value={ghl ? `${formatNumber(ghl.roas)}x` : "—"}
            sub={meta && ghl ? `$${formatNumber(ghl.revenue, 0)} / $${formatNumber(meta.spend, 0)}` : undefined}
          />
        </div>
      </div>

      {/* Chart */}
      <MetricsChart
        clientId={clientId}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
      />
    </div>
  );
}
