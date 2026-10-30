import { Suspense } from "react";
import { SearchPage } from "@/components/search";
import { Loading } from "@/components/ui";
export const metadata = { title: "Discover homes for sale" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchPage />
    </Suspense>
  );
}
