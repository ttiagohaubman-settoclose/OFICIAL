"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClientMetrics, DateRange } from "@/types";
import { DateRangePicker } from "@/components/DateRangePicker";
import { RefreshButton } from "@/components/RefreshButton";
import { formatCurrency, formatNumber, formatPercent, REFRESH_INTERVAL_MS } from "@/lib/config";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function AgencyDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;
  const clientId = (session?.user as any)?.clientId;

  useEffect(() => {
    if (role === "client" && clientId) router.replace(`/dashboard/${clientId}`);
  }, [role, clientId, router]);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: monthStart(),
    endDate: localDate(),
  });
  const [allMetrics, setAllMetrics] = useState<ClientMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        client: "all",
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const res = await fetch(`/api/metrics?${params}`);
      if (!res.ok) throw new Error("Failed");
      const json: ClientMetrics[] = await res.json();
      setAllMetrics(json);
      setLastUpdated(new Date());
    } catch {
      // keep previous
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  const totals = allMetrics.reduce(
    (acc, m) => ({
      spend: acc.spend + (m.meta?.spend ?? 0),
      leads: acc.leads + (m.meta?.leads ?? 0),
      citasAgendadas: acc.citasAgendadas + (m.ghl?.citasAgendadas ?? 0),
      dealsClosed: acc.dealsClosed + (m.ghl?.dealsClosed ?? 0),
      revenue: acc.revenue + (m.ghl?.revenue ?? 0),
      cashCollected: acc.cashCollected + (m.ghl?.cashCollected ?? 0),
    }),
    { spend: 0, leads: 0, citasAgendadas: 0, dealsClosed: 0, revenue: 0, cashCollected: 0 }
  );

  const totalRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const totalCpl = totals.leads > 0 ? totals.spend / totals.leads : 0;

  const totalStats = [
    { label: "Total Ad Spend", value: formatCurrency(totals.spend) },
    { label: "Total Leads", value: formatNumber(totals.leads, 0) },
    { label: "CPL", value: formatCurrency(totalCpl) },
    { label: "Citas Agendadas", value: formatNumber(totals.citasAgendadas, 0) },
    { label: "Deals Closed", value: formatNumber(totals.dealsClosed, 0) },
    { label: "Revenue", value: formatCurrency(totals.revenue) },
    { label: "Cash Collected", value: formatCurrency(totals.cashCollected) },
    { label: "ROAS", value: `${formatNumber(totalRoas)}x` },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#f9f9f9] dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Agency Overview</h1>
          <p className="text-sm text-gray-400 dark:text-[#555] mt-0.5">All clients consolidated</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <RefreshButton onRefresh={fetchAll} loading={loading} lastUpdated={lastUpdated} />
        </div>
      </div>

      {/* Totals */}
      <div>
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-3">Total</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {totalStats.map((m) => (
            <div key={m.label} className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1c1c1c] rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-2">{m.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Per-client cards */}
      <div>
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-[#555] uppercase tracking-wider mb-3">Clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allMetrics.map((m) => (
            <Link
              key={m.client.id}
              href={`/dashboard/${m.client.id}`}
              className="group bg-white dark:bg-[#111] border border-gray-100 dark:border-[#1c1c1c] rounded-xl p-5 hover:border-gray-300 dark:hover:border-[#333] transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{m.client.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-[#555]">{m.client.state}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-[#333] group-hover:text-gray-500 dark:group-hover:text-[#666] transition-colors" />
              </div>

              {m.error && !m.meta && !m.ghl ? (
                <p className="text-xs text-red-400">{m.error}</p>
              ) : (
                <>
                  {m.error && (
                    <p className="text-xs text-red-400 mb-3">{m.error}</p>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Spend", value: m.meta ? formatCurrency(m.meta.spend) : "—" },
                      { label: "Leads", value: m.meta ? formatNumber(m.meta.leads, 0) : "—" },
                      { label: "CPL", value: m.meta ? formatCurrency(m.meta.cpl) : "—" },
                      { label: "Citas", value: m.ghl ? formatNumber(m.ghl.citasAgendadas, 0) : "—" },
                      { label: "Closed", value: m.ghl ? formatNumber(m.ghl.dealsClosed, 0) : "—" },
                      { label: "ROAS", value: m.ghl ? `${formatNumber(m.ghl.roas)}x` : "—" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-[10px] text-gray-400 dark:text-[#555] mb-0.5 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
