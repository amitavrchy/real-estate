import { notFound } from "next/navigation";
import { NeighborhoodPage } from "@/components/editorial";
import { serverGet } from "@/lib/server";
import type { Neighborhood } from "@/lib/types";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const n = await serverGet<Neighborhood>(
    `/neighborhoods/${(await params).slug}`,
  );
  return {
    title: n ? `${n.name} — A place to belong` : "Neighborhoods",
    description: n?.description,
  };
}
export default async function Page({ params }: Props) {
  const n = await serverGet<Neighborhood>(
    `/neighborhoods/${(await params).slug}`,
  );
  if (!n) notFound();
  return <NeighborhoodPage neighborhood={n} />;
}
