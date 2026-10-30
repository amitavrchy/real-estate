import { notFound } from "next/navigation";
import { AgentProfile } from "@/components/editorial";
import { serverGet } from "@/lib/server";
import type { Agent } from "@/lib/types";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const a = await serverGet<Agent>(`/agents/${(await params).slug}`);
  return {
    title: a ? `${a.name} — Your property advisor` : "Our people",
    description: a?.bio,
  };
}
export default async function Page({ params }: Props) {
  const a = await serverGet<Agent>(`/agents/${(await params).slug}`);
  if (!a) notFound();
  return <AgentProfile agent={a} />;
}
