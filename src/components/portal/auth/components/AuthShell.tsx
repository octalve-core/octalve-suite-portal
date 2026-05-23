import type React from "react";
import { AuthBrand } from "./AuthBrand";
import { AuthSidePanel } from "./AuthSidePanel";
import type { AuthMode } from "../auth-config";

export function AuthShell({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: AuthMode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen gap-4 p-4 lg:grid-cols-[minmax(430px,0.82fr)_minmax(560px,1.18fr)]">
        <section className="flex min-h-[calc(100vh-32px)] items-center justify-center px-4 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-16 flex justify-center lg:justify-start">
              <AuthBrand />
            </div>

            <div>
              <h1 className="text-[42px] font-semibold leading-none tracking-[-0.065em] text-[#111827]">
                {title}
              </h1>
              <p className="mt-4 text-[17px] font-medium leading-7 text-slate-500">
                {subtitle}
              </p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </section>

        <AuthSidePanel mode={mode} />
      </div>
    </main>
  );
}
