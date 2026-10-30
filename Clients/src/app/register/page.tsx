import { Suspense } from "react";
import { AuthPage } from "@/components/auth";
import { Loading } from "@/components/ui";
export const metadata = {
  title: "Make yourself at home",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthPage register />
    </Suspense>
  );
}
