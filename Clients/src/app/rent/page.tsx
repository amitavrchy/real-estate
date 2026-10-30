import { Suspense } from "react";
import { SearchPage } from "@/components/search";
import { Loading } from "@/components/ui";
export const metadata = { title: "Find your next rental" };
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchPage rent />
    </Suspense>
  );
}
