import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaMetrics } from "@/lib/meta";
import { CLIENTS } from "@/lib/config";

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

  const results = await Promise.all(
    clientsToFetch.map(async (client) => {
      const metaResult = await getMetaMetrics(client.adAccountId, startDate, endDate)
        .then((v) => ({ ok: true as const, value: v }))
        .catch((e) => ({ ok: false as const, error: e instanceof Error ? e.message : "Meta error" }));

      return {
        client,
        meta: metaResult.ok ? metaResult.value : null,
        metaError: metaResult.ok ? null : metaResult.error,
      };
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
