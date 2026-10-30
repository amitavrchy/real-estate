import { Dashboard } from "@/components/dashboard";
export const metadata = {
  title: "Haven workspace",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  return <Dashboard section={(await params).section?.[0] ?? ""} />;
}
