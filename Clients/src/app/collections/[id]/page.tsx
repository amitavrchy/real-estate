import { CollectionDetail } from "@/components/collections";
export const metadata = {
  title: "A collection of possibilities",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <CollectionDetail id={(await params).id} />;
}
