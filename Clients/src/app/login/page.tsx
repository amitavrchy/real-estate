import { Suspense } from "react";
import { AuthPage } from "@/components/auth";
import { Loading } from "@/components/ui";
export const metadata = {
  title: "Welcome home",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthPage />
    </Suspense>
  );
}
