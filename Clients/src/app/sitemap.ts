import type { MetadataRoute } from "next";
import { serverGet } from "@/lib/server";
import type { Agent, Neighborhood, PageResult, Post } from "@/lib/types";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  const [homes, agents, neighborhoods, posts] = await Promise.all([
    serverGet<PageResult>("/properties?limit=100"),
    serverGet<Agent[]>("/agents"),
    serverGet<Neighborhood[]>("/neighborhoods"),
    serverGet<Post[]>("/journal"),
  ]);
  const paths = [
    "",
    "/search",
    "/rent",
    "/sell",
    "/valuation",
    "/agents",
    "/journal",
    ...(homes?.items.map((p) => `/property/${p.slug}`) ?? []),
    ...(agents?.map((a) => `/agents/${a.id}`) ?? []),
    ...(neighborhoods?.map((n) => `/neighborhoods/${n.slug}`) ?? []),
    ...(posts?.map((p) => `/journal/${p.slug}`) ?? []),
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path.includes("property") ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
