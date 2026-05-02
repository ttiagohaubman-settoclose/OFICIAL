import { MetaMetrics, DailyMetrics } from "@/types";

const META_API_BASE = "https://graph.facebook.com/v18.0";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

interface MetaInsightAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  clicks?: string;
  cpc?: string;
  ctr?: string;
  actions?: MetaInsightAction[];
  cost_per_action_type?: MetaInsightAction[];
  date_start?: string;
}

function extractLeads(actions?: MetaInsightAction[]): number {
  if (!actions) return 0;
  const leadAction = actions.find((a) => a.action_type === "lead");
  return leadAction ? parseFloat(leadAction.value) : 0;
}

export async function getMetaMetrics(
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<MetaMetrics> {
  const params = new URLSearchParams({
    access_token: ACCESS_TOKEN!,
    fields: "spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type",
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    level: "account",
  });

  const url = `${META_API_BASE}/${adAccountId}/insights?${params}`;

  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Meta API error: ${res.status} - ${errText}`);
  }

  const json = await res.json();
  const data: MetaInsightRow[] = json.data ?? [];

  if (data.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      cpc: 0,
      ctr: 0,
      leads: 0,
      cpl: 0,
    };
  }

  const row = data[0];
  const spend = parseFloat(row.spend ?? "0");
  const leads = extractLeads(row.actions);
  const cpl = leads > 0 ? spend / leads : 0;

  return {
    spend: parseFloat((spend).toFixed(2)),
    impressions: parseFloat(parseFloat(row.impressions ?? "0").toFixed(2)),
    clicks: parseFloat(parseFloat(row.clicks ?? "0").toFixed(2)),
    cpc: parseFloat(parseFloat(row.cpc ?? "0").toFixed(2)),
    ctr: parseFloat(parseFloat(row.ctr ?? "0").toFixed(2)),
    leads: parseFloat(leads.toFixed(2)),
    cpl: parseFloat(cpl.toFixed(2)),
  };
}

export async function getMetaDailyMetrics(
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]> {
  const params = new URLSearchParams({
    access_token: ACCESS_TOKEN!,
    fields: "spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type",
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    time_increment: "1",
    level: "account",
  });

  const url = `${META_API_BASE}/${adAccountId}/insights?${params}`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Meta API error: ${res.status} - ${errText}`);
  }

  const json = await res.json();
  const data: MetaInsightRow[] = json.data ?? [];

  return data.map((row) => {
    const spend = parseFloat(row.spend ?? "0");
    const leads = extractLeads(row.actions);
    const cpl = leads > 0 ? spend / leads : 0;

    return {
      date: row.date_start ?? "",
      spend: parseFloat(spend.toFixed(2)),
      impressions: parseFloat(parseFloat(row.impressions ?? "0").toFixed(2)),
      clicks: parseFloat(parseFloat(row.clicks ?? "0").toFixed(2)),
      cpc: parseFloat(parseFloat(row.cpc ?? "0").toFixed(2)),
      ctr: parseFloat(parseFloat(row.ctr ?? "0").toFixed(2)),
      leads: parseFloat(leads.toFixed(2)),
      cpl: parseFloat(cpl.toFixed(2)),
    };
  });
}
