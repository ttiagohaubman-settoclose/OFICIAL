import { GHLMetrics } from "@/types";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_TOKEN = process.env.GHL_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

interface GHLContact {
  id: string;
  tags?: string[];
}

interface GHLContactsResponse {
  contacts: GHLContact[];
  meta?: { total?: number; nextPageUrl?: string | null };
}

function ghlHeaders() {
  return {
    Authorization: `Bearer ${GHL_TOKEN}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
}

async function fetchAllContactsWithTag(tag: string): Promise<GHLContact[]> {
  const all: GHLContact[] = [];
  let after: string | undefined = undefined;

  while (true) {
    const params = new URLSearchParams({
      locationId: LOCATION_ID!,
      limit: "100",
      tags: tag,
    });
    if (after) params.set("startAfterId", after);

    const res = await fetch(`${GHL_BASE}/contacts/?${params}`, {
      headers: ghlHeaders(),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GHL API error: ${res.status} - ${err}`);
    }

    const json: GHLContactsResponse = await res.json();
    const contacts = json.contacts ?? [];
    all.push(...contacts);

    if (contacts.length < 100 || !json.meta?.nextPageUrl) break;
    after = contacts[contacts.length - 1].id;
  }

  return all;
}

function hasTag(contact: GHLContact, tag: string): boolean {
  return (contact.tags ?? []).some(
    (t) => t.toLowerCase() === tag.toLowerCase()
  );
}

export async function getGHLMetrics(
  clientTag: string,
  payout: number
): Promise<GHLMetrics> {
  const contacts = await fetchAllContactsWithTag(clientTag);

  const scheduled = contacts.filter((c) => hasTag(c, "scheduled")).length;
  const venta = contacts.filter((c) => hasTag(c, "venta")).length;
  const pagada = contacts.filter((c) => hasTag(c, "pagada")).length;

  const showRate = scheduled > 0 ? (venta / scheduled) * 100 : 0;
  const closeRate = venta > 0 ? (venta / scheduled) * 100 : 0;

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
