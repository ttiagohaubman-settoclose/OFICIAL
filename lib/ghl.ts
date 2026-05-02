import { GHLMetrics } from "@/types";

const GHL_BASE = "https://rest.gohighlevel.com/v1";
const GHL_TOKEN = process.env.GHL_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

interface GHLContact {
  id: string;
  tags?: string[];
}

interface GHLResponse {
  contacts: GHLContact[];
  meta?: { total: number };
}

async function fetchContactsByTag(tag: string): Promise<GHLContact[]> {
  const all: GHLContact[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const params = new URLSearchParams({
      locationId: LOCATION_ID!,
      limit: String(limit),
      page: String(page),
      tags: tag,
    });

    const res = await fetch(`${GHL_BASE}/contacts/?${params}`, {
      headers: { Authorization: `Bearer ${GHL_TOKEN}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GHL API error: ${res.status} - ${err}`);
    }

    const json: GHLResponse = await res.json();
    const contacts = json.contacts ?? [];
    all.push(...contacts);

    if (contacts.length < limit) break;
    page++;
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
  // Fetch contacts with the client tag
  const contacts = await fetchContactsByTag(clientTag);

  const scheduled = contacts.filter((c) => hasTag(c, "scheduled")).length;
  const venta = contacts.filter((c) => hasTag(c, "venta")).length;
  const pagada = contacts.filter((c) => hasTag(c, "pagada")).length;

  // Shows = contacts that have both scheduled + venta (showed AND closed) OR we estimate from closed
  // Show rate = deals closed / scheduled (since no separate "show" tag exists)
  const shows = venta; // approximate: anyone who closed must have shown
  const showRate = scheduled > 0 ? (shows / scheduled) * 100 : 0;
  const closeRate = shows > 0 ? (venta / shows) * 100 : 0;

  const revenue = venta * payout;
  const cashCollected = pagada * payout;

  return {
    citasAgendadas: scheduled,
    shows,
    showRate: parseFloat(showRate.toFixed(2)),
    dealsClosed: venta,
    closeRate: parseFloat(closeRate.toFixed(2)),
    revenue,
    cashCollected,
    roas: 0, // calculated after combining with meta spend
  };
}
