import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaMetrics } from "@/lib/meta";
import { getGHLMetrics } from "@/lib/ghl";
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

  const results: ClientMetrics[] = await Promise.all(
    clientsToFetch.map(async (client) => {
      const [metaResult, ghlResult] = await Promise.allSettled([
        getMetaMetrics(client.adAccountId, startDate, endDate),
        getGHLMetrics(client.ghlTag, client.payout),
      ]);

      const meta = metaResult.status === "fulfilled" ? metaResult.value : null;
      const ghlRaw = ghlResult.status === "fulfilled" ? ghlResult.value : null;

      const roas = meta && ghlRaw && meta.spend > 0 ? ghlRaw.revenue / meta.spend : 0;
      const ghl = ghlRaw ? { ...ghlRaw, roas: parseFloat(roas.toFixed(2)) } : null;

      const errors = [
        metaResult.status === "rejected" ? `Meta: ${metaResult.reason?.message}` : null,
        ghlResult.status === "rejected" ? `GHL: ${ghlResult.reason?.message}` : null,
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
