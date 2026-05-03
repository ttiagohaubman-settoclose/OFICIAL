import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaMetrics } from "@/lib/meta";
import { fetchAllGHLContacts, computeGHLMetrics } from "@/lib/ghl";
import { CLIENTS } from "@/lib/config";
import { ClientMetrics } from "@/types";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const clientParam = searchParams.get("client");
  const startDate = searchParams.get("startDate") ?? getDefaultStart();
  const endDate = searchParams.get("endDate") ?? getDefaultEnd();

  const userRole = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  let clientsToFetch = CLIENTS;
  if (userRole === "client") {
    clientsToFetch = CLIENTS.filter((c) => c.id === userClientId);
  } else if (clientParam && clientParam !== "all") {
    clientsToFetch = CLIENTS.filter((c) => c.id === clientParam);
  }

  // Fetch GHL contacts ONCE for all clients (avoids rate limiting)
  let allGHLContacts: Awaited<ReturnType<typeof fetchAllGHLContacts>> | null = null;
  let ghlError: string | null = null;

  try {
    allGHLContacts = await fetchAllGHLContacts();
  } catch (err) {
    ghlError = err instanceof Error ? err.message : "GHL fetch failed";
  }

  // Fetch Meta in parallel for all clients
  const results: ClientMetrics[] = await Promise.all(
    clientsToFetch.map(async (client) => {
      const metaResult = await getMetaMetrics(client.adAccountId, startDate, endDate)
        .then((v) => ({ ok: true as const, value: v }))
        .catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "Meta error" }));

      const meta = metaResult.ok ? metaResult.value : null;

      const ghl =
        allGHLContacts
          ? (() => {
              const g = computeGHLMetrics(allGHLContacts, client.ghlTag, client.payout);
              const roas = meta && meta.spend > 0 ? g.revenue / meta.spend : 0;
              return { ...g, roas: parseFloat(roas.toFixed(2)) };
            })()
          : null;

      const errors = [
        !metaResult.ok ? `Meta: ${metaResult.error}` : null,
        ghlError ? `GHL: ${ghlError}` : null,
      ].filter(Boolean).join(" | ");

      return { client, meta, ghl, error: errors || undefined };
    })
  );

  return NextResponse.json(results);
}

function getDefaultStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultEnd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
