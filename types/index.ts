export interface ClientConfig {
  id: string;
  name: string;
  state: string;
  ghlTag: string;
  adAccountId: string;
  payout: number;
}

export interface MetaMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  leads: number;
  cpl: number;
}

export interface GHLMetrics {
  citasAgendadas: number;
  shows: number;
  showRate: number;
  dealsClosed: number;
  closeRate: number;
  revenue: number;
  cashCollected: number;
  roas: number;
}

export interface ClientMetrics {
  client: ClientConfig;
  meta: MetaMetrics | null;
  ghl: GHLMetrics | null;
  error?: string;
}

export interface DailyMetrics {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  leads: number;
  cpl: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'client';
  clientId: string | null;
}

export interface AuthUser extends User {
  name: string;
  email: string;
}

export type MetricKey =
  | 'spend'
  | 'impressions'
  | 'clicks'
  | 'cpc'
  | 'ctr'
  | 'leads'
  | 'cpl';
