"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ClientMetrics, DateRange, DailyMetrics } from "@/types";
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
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client: clientId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const [metricsRes, chartRes] = await Promise.all([
        fetch(`/api/metrics?${params}`),
        fetch(`/api/chart?${params}`),
      ]);
      if (metricsRes.ok) {
        const json: ClientMetrics[] = await metricsRes.json();
        setMetrics(json[0] ?? null);
      }
      if (chartRes.ok) {
        const daily: DailyMetrics[] = await chartRes.json();
        setDailyData(daily);
      }
      setLastUpdated(new Date());
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, [clientId, dateRange]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const spark = (key: keyof DailyMetrics) =>
    dailyData.map((d) => Number(d[key]) || 0);

  const meta = metrics?.meta;
  const ghl = metrics?.ghl;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {metrics?.client && (
            <p className="text-sm text-gray-400 dark:text-[#555] mt-0.5">{metrics.client.state}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <RefreshButton onRefresh={fetchAll} loading={loading} lastUpdated={lastUpdated} />
        </div>
      </div>

      {metrics?.error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs border border-red-100 dark:border-red-900">
          {metrics.error}
        </div>
      )}

      {/* Meta Ads */}
      <div>
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-3">
          Meta Ads
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <MetricCard label="Ad Spend" value={meta ? formatCurrency(meta.spend) : "—"} sparkData={spark("spend")} />
          <MetricCard label="Impressions" value={meta ? formatNumber(meta.impressions, 0) : "—"} sparkData={spark("impressions")} />
          <MetricCard label="Link Clicks" value={meta ? formatNumber(meta.clicks, 0) : "—"} sparkData={spark("clicks")} />
          <MetricCard label="CPC" value={meta ? formatCurrency(meta.cpc) : "—"} sparkData={spark("cpc")} positive={false} />
          <MetricCard label="CTR" value={meta ? formatPercent(meta.ctr) : "—"} sparkData={spark("ctr")} />
          <MetricCard label="Leads" value={meta ? formatNumber(meta.leads, 0) : "—"} sparkData={spark("leads")} />
          <MetricCard label="CPL" value={meta ? formatCurrency(meta.cpl) : "—"} sparkData={spark("cpl")} positive={false} />
        </div>
      </div>

      {/* GHL */}
      <div>
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-3">
          Pipeline (GoHighLevel)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <MetricCard label="Citas Agendadas" value={ghl ? formatNumber(ghl.citasAgendadas, 0) : "—"} />
          <MetricCard label="Show Rate" value={ghl ? formatPercent(ghl.showRate) : "—"} />
          <MetricCard label="Deals Closed" value={ghl ? formatNumber(ghl.dealsClosed, 0) : "—"} />
          <MetricCard label="Close Rate" value={ghl ? formatPercent(ghl.closeRate) : "—"} />
          <MetricCard label="Revenue" value={ghl ? formatCurrency(ghl.revenue) : "—"} />
          <MetricCard label="Cash Collected" value={ghl ? formatCurrency(ghl.cashCollected) : "—"} />
          <MetricCard label="ROAS" value={ghl ? `${formatNumber(ghl.roas)}x` : "—"} />
        </div>
      </div>

      {/* Chart */}
      <MetricsChart
        clientId={clientId}
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        externalData={dailyData}
      />
    </div>
  );
}
