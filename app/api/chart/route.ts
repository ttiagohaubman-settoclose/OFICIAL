import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaDailyMetrics } from "@/lib/meta";
import { getClientById } from "@/lib/config";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const clientId = searchParams.get("client");
  const startDate = searchParams.get("startDate") ?? getDefaultStart();
  const endDate = searchParams.get("endDate") ?? getDefaultEnd();

  if (!clientId) return NextResponse.json({ error: "client required" }, { status: 400 });

  const userRole = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  if (userRole === "client" && userClientId !== clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const client = getClientById(clientId);
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  try {
    const data = await getMetaDailyMetrics(client.adAccountId, startDate, endDate);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function getDefaultStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function getDefaultEnd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
