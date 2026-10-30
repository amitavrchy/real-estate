import { notFound } from "next/navigation";
import { JournalArticle } from "@/components/editorial";
import { serverGet } from "@/lib/server";
import type { Post } from "@/lib/types";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const p = await serverGet<Post>(`/journal/${(await params).slug}`);
  return {
    title: p?.title ?? "The Haven Journal",
    description: p?.excerpt,
    openGraph: p
      ? {
          title: p.title,
          description: p.excerpt,
          images: [p.coverImage],
          type: "article" as const,
        }
      : undefined,
  };
}
export default async function Page({ params }: Props) {
  const p = await serverGet<Post>(`/journal/${(await params).slug}`);
  if (!p) notFound();
  return <JournalArticle post={p} />;
}
