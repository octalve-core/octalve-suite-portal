"use client";

import type React from "react";
import { AppProvider } from "@/components/portal/AppContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}
