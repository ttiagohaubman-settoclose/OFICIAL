import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getClientById } from "@/lib/config";
import { ClientMetricsView } from "@/components/ClientMetricsView";

interface Props {
  params: Promise<{ client: string }>;
}

export default async function ClientPage({ params }: Props) {
  const { client: clientId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role;
  const userClientId = (session.user as any).clientId;

  if (role === "client" && userClientId !== clientId) redirect(`/dashboard/${userClientId}`);

  const client = getClientById(clientId);
  if (!client) notFound();

  return <ClientMetricsView clientId={client.id} title={client.name} />;
}
