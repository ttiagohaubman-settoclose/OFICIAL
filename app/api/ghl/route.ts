import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAllGHLContacts, computeGHLMetrics } from "@/lib/ghl";
import { CLIENTS } from "@/lib/config";

export const maxDuration = 30; // Up to 30s on Vercel Pro, 10s on hobby

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const clientParam = searchParams.get("client");

  const userRole = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  let clientsToFetch = CLIENTS;
  if (userRole === "client") {
    clientsToFetch = CLIENTS.filter((c) => c.id === userClientId);
  } else if (clientParam && clientParam !== "all") {
    clientsToFetch = CLIENTS.filter((c) => c.id === clientParam);
  }

  try {
    const allContacts = await fetchAllGHLContacts();

    const results = clientsToFetch.map((client) => ({
      clientId: client.id,
      ghl: computeGHLMetrics(allContacts, client.ghlTag, client.payout),
    }));

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GHL fetch failed" },
      { status: 500 }
    );
  }
}
