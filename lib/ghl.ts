import { GHLMetrics } from "@/types";

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_TOKEN = process.env.GHL_TOKEN;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

const GHL_HEADERS = {
  Authorization: `Bearer ${GHL_TOKEN}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
};

interface GHLContact {
  id: string;
  tags?: string[];
}

interface GHLSearchResponse {
  contacts: GHLContact[];
  total: number;
  startAfter?: string;
  startAfterId?: string;
}

async function fetchContactsByTag(tag: string): Promise<GHLContact[]> {
  const all: GHLContact[] = [];
  let startAfter: number | undefined;
  let startAfterId: string | undefined;
  const limit = 100;

  while (true) {
    const body: Record<string, unknown> = {
      locationId: LOCATION_ID,
      pageSize: limit,
      filters: [
        {
          field: "tags",
          operator: "contains_any",
          value: [tag],
        },
      ],
    };

    if (startAfter !== undefined && startAfterId !== undefined) {
      body.startAfter = startAfter;
      body.startAfterId = startAfterId;
    }

    const res = await fetch(`${GHL_BASE}/contacts/search`, {
      method: "POST",
      headers: GHL_HEADERS,
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GHL API error: ${res.status} - ${err}`);
    }

    const json: GHLSearchResponse = await res.json();
    const contacts = json.contacts ?? [];
    all.push(...contacts);

    if (contacts.length < limit || !json.startAfter) break;
    startAfter = Number(json.startAfter);
    startAfterId = json.startAfterId;
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
  const contacts = await fetchContactsByTag(clientTag);

  const scheduled = contacts.filter((c) => hasTag(c, "scheduled")).length;
  const venta = contacts.filter((c) => hasTag(c, "venta")).length;
  const pagada = contacts.filter((c) => hasTag(c, "pagada")).length;

  const shows = venta;
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
    roas: 0,
  };
}
