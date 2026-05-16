import { Suspense } from "react";
import { LoginScreen } from "@/components/portal/AuthScreens";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
