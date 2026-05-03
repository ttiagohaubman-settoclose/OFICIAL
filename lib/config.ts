import { ClientConfig } from '@/types';

export const CLIENTS: ClientConfig[] = [
  {
    id: 'jorge',
    name: 'Jorge',
    state: 'Virginia',
    ghlTag: 'va leads - jorge',
    adAccountId: 'act_1423143898800903',
    payout: 750,
  },
  {
    id: 'fernando',
    name: 'Fernando',
    state: 'Maryland',
    ghlTag: 'md leads - fernando',
    adAccountId: 'act_795631173072316',
    payout: 500,
  },
  {
    id: 'danelly',
    name: 'Danelly',
    state: 'North Carolina',
    ghlTag: 'nc leads - danelly',
    adAccountId: 'act_1482791790226418',
    payout: 750,
  },
  {
    id: 'ay',
    name: 'A&Y',
    state: 'South Carolina',
    ghlTag: 'sc leads - a&y',
    adAccountId: 'act_751411627703795',
    payout: 750,
  },
];

export const GHL_TAGS = {
  scheduled: 'scheduled',
  english: 'english',
  spanish: 'español',
  venta: 'venta',
  pagada: 'pagada',
} as const;

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function getClientById(id: string): ClientConfig | undefined {
  return CLIENTS.find((c) => c.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${formatNumber(value)}%`;
}
