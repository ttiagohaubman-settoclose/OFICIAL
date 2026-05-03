import { GHLMetrics } from "@/types";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_TOKEN = process.env.GHL_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

export interface GHLContact {
  id: string;
  tags?: string[];
}

interface GHLContactsResponse {
  contacts: GHLContact[];
}

function ghlHeaders() {
  return {
    Authorization: `Bearer ${GHL_TOKEN}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

async function fetchPage(startAfterId?: string): Promise<GHLContactsResponse> {
  const params = new URLSearchParams({ locationId: LOCATION_ID!, limit: "100" });
  if (startAfterId) params.set("startAfterId", startAfterId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${GHL_BASE}/contacts/?${params}`, {
      headers: ghlHeaders(),
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GHL API error: ${res.status} - ${err}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Max 10 pages = 1000 contacts to stay within Vercel's 10s timeout
const MAX_PAGES = 10;

export async function fetchAllGHLContacts(): Promise<GHLContact[]> {
  const all: GHLContact[] = [];
  let startAfterId: string | undefined = undefined;
  let page = 0;

  while (page < MAX_PAGES) {
    const json = await fetchPage(startAfterId);
    const contacts = json.contacts ?? [];
    all.push(...contacts);
    page++;

    if (contacts.length < 100) break;
    startAfterId = contacts[contacts.length - 1].id;
  }

  return all;
}

function hasTag(contact: GHLContact, tag: string): boolean {
  return (contact.tags ?? []).some((t) => t.toLowerCase() === tag.toLowerCase());
}

export function computeGHLMetrics(
  allContacts: GHLContact[],
  clientTag: string,
  payout: number
): GHLMetrics {
  const clientContacts = allContacts.filter((c) => hasTag(c, clientTag));

  const scheduled = clientContacts.filter((c) => hasTag(c, "scheduled")).length;
  const venta = clientContacts.filter((c) => hasTag(c, "venta")).length;
  const pagada = clientContacts.filter((c) => hasTag(c, "pagada")).length;

  const showRate = scheduled > 0 ? (venta / scheduled) * 100 : 0;
  const closeRate = scheduled > 0 ? (venta / scheduled) * 100 : 0;

  return {
    citasAgendadas: scheduled,
    shows: venta,
    showRate: parseFloat(showRate.toFixed(2)),
    dealsClosed: venta,
    closeRate: parseFloat(closeRate.toFixed(2)),
    revenue: venta * payout,
    cashCollected: pagada * payout,
    roas: 0,
  };
}
