import { CollectionsPage } from "@/components/collections";
export const metadata = {
  title: "Your collections",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <CollectionsPage />;
}
