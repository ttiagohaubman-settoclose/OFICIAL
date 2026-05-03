"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DateRange, DailyMetrics, GHLMetrics, MetaMetrics, ClientConfig } from "@/types";
import { MetricCard } from "./MetricCard";
import { MetricsChart } from "./MetricsChart";
import { DateRangePicker } from "./DateRangePicker";
import { RefreshButton } from "./RefreshButton";
import { REFRESH_INTERVAL_MS, formatCurrency, formatNumber, formatPercent } from "@/lib/config";

interface ClientMetricsViewProps {
  clientId: string;
  title: string;
  clientConfig?: ClientConfig;
}

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ClientMetricsView({ clientId, title }: ClientMetricsViewProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: monthStart(),
    endDate: localDate(),
  });

  const [meta, setMeta] = useState<MetaMetrics | null>(null);
  const [ghl, setGhl] = useState<GHLMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [clientState, setClientState] = useState<string>("");

  const [metaLoading, setMetaLoading] = useState(true);
  const [ghlLoading, setGhlLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [ghlError, setGhlError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMeta = useCallback(async () => {
    setMetaLoading(true);
    setMetaError(null);
    try {
      const params = new URLSearchParams({ client: clientId, startDate: dateRange.startDate, endDate: dateRange.endDate });
      const [metricsRes, chartRes] = await Promise.all([
        fetch(`/api/metrics?${params}`),
        fetch(`/api/chart?${params}`),
      ]);
      if (metricsRes.ok) {
        const json = await metricsRes.json();
        const row = json.find((r: any) => r.client?.id === clientId) ?? json[0];
        if (row) {
          setMeta(row.meta);
          setClientState(row.client?.state ?? "");
          if (row.metaError) setMetaError(row.metaError);
        }
      }
      if (chartRes.ok) {
        const daily: DailyMetrics[] = await chartRes.json();
        setDailyData(daily);
      }
      setLastUpdated(new Date());
    } catch (e) {
      setMetaError(e instanceof Error ? e.message : "Error");
    } finally {
      setMetaLoading(false);
    }
  }, [clientId, dateRange]);

  const fetchGHL = useCallback(async () => {
    setGhlLoading(true);
    setGhlError(null);
    try {
      const params = new URLSearchParams({ client: clientId });
      const res = await fetch(`/api/ghl?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "GHL error");
      }
      const json = await res.json();
      const row = Array.isArray(json) ? json.find((r: any) => r.clientId === clientId) ?? json[0] : null;
      if (row?.ghl) {
        const spend = meta?.spend ?? 0;
        const roas = spend > 0 ? row.ghl.revenue / spend : 0;
        setGhl({ ...row.ghl, roas: parseFloat(roas.toFixed(2)) });
      }
    } catch (e) {
      setGhlError(e instanceof Error ? e.message : "GHL error");
    } finally {
      setGhlLoading(false);
    }
  }, [clientId, meta?.spend]);

  const refresh = useCallback(async () => {
    await fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchMeta();
    intervalRef.current = setInterval(fetchMeta, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchMeta]);

  // Load GHL after Meta (avoids parallel heavy requests)
  useEffect(() => {
    if (!metaLoading) fetchGHL();
  }, [metaLoading, fetchGHL]);

  const spark = (key: keyof DailyMetrics) => dailyData.map((d) => Number(d[key]) || 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9f9f9] dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {clientState && <p className="text-sm text-gray-400 dark:text-[#555] mt-0.5">{clientState}</p>}
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <RefreshButton onRefresh={refresh} loading={metaLoading || ghlLoading} lastUpdated={lastUpdated} />
        </div>
      </div>

      {/* Meta Ads */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider">Meta Ads</h2>
          {metaLoading && <span className="text-[10px] text-gray-400 dark:text-[#555]">Loading...</span>}
          {metaError && <span className="text-[10px] text-red-400">{metaError}</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <MetricCard label="Ad Spend" value={meta ? formatCurrency(meta.spend) : "—"} sparkData={spark("spend")} loading={metaLoading} />
          <MetricCard label="Impressions" value={meta ? formatNumber(meta.impressions, 0) : "—"} sparkData={spark("impressions")} loading={metaLoading} />
          <MetricCard label="Link Clicks" value={meta ? formatNumber(meta.clicks, 0) : "—"} sparkData={spark("clicks")} loading={metaLoading} />
          <MetricCard label="CPC" value={meta ? formatCurrency(meta.cpc) : "—"} sparkData={spark("cpc")} positive={false} loading={metaLoading} />
          <MetricCard label="CTR" value={meta ? formatPercent(meta.ctr) : "—"} sparkData={spark("ctr")} loading={metaLoading} />
          <MetricCard label="Leads" value={meta ? formatNumber(meta.leads, 0) : "—"} sparkData={spark("leads")} loading={metaLoading} />
          <MetricCard label="CPL" value={meta ? formatCurrency(meta.cpl) : "—"} sparkData={spark("cpl")} positive={false} loading={metaLoading} />
        </div>
      </div>

      {/* GHL */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider">Pipeline (GoHighLevel)</h2>
          {ghlLoading && <span className="text-[10px] text-gray-400 dark:text-[#555]">Loading...</span>}
          {ghlError && <span className="text-[10px] text-red-400">{ghlError}</span>}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <MetricCard label="Citas Agendadas" value={ghl ? formatNumber(ghl.citasAgendadas, 0) : "—"} loading={ghlLoading} />
          <MetricCard label="Show Rate" value={ghl ? formatPercent(ghl.showRate) : "—"} loading={ghlLoading} />
          <MetricCard label="Deals Closed" value={ghl ? formatNumber(ghl.dealsClosed, 0) : "—"} loading={ghlLoading} />
          <MetricCard label="Close Rate" value={ghl ? formatPercent(ghl.closeRate) : "—"} loading={ghlLoading} />
          <MetricCard label="Revenue" value={ghl ? formatCurrency(ghl.revenue) : "—"} loading={ghlLoading} />
          <MetricCard label="Cash Collected" value={ghl ? formatCurrency(ghl.cashCollected) : "—"} loading={ghlLoading} />
          <MetricCard label="ROAS" value={ghl ? `${formatNumber(ghl.roas)}x` : "—"} loading={ghlLoading} />
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
