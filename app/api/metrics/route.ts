import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaMetrics } from "@/lib/meta";
import { getGHLMetrics } from "@/lib/ghl";
import { getClientById, CLIENTS } from "@/lib/config";
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

  // Determine which clients to fetch
  let clientsToFetch = CLIENTS;
  if (userRole === "client") {
    clientsToFetch = CLIENTS.filter((c) => c.id === userClientId);
  } else if (clientParam && clientParam !== "all") {
    clientsToFetch = CLIENTS.filter((c) => c.id === clientParam);
  }

  const results: ClientMetrics[] = await Promise.all(
    clientsToFetch.map(async (client) => {
      try {
        const [meta, ghl] = await Promise.all([
          getMetaMetrics(client.adAccountId, startDate, endDate),
          getGHLMetrics(client.ghlTag, client.payout),
        ]);

        const roas = meta.spend > 0 ? ghl.revenue / meta.spend : 0;

        return {
          client,
          meta,
          ghl: { ...ghl, roas: parseFloat(roas.toFixed(2)) },
        };
      } catch (error) {
        return {
          client,
          meta: null,
          ghl: null,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
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
