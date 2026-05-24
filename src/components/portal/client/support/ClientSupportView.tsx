"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { WorkspacePublicSettings } from "@/lib/types";
import { useApp } from "../../AppContext";
import {
  getActiveSupportPhase,
} from "./client-support-utils";
import { ClientSupportFaq } from "./ClientSupportFaq";
import { ClientSupportHero } from "./ClientSupportHero";
import { ClientSupportProjectContext } from "./ClientSupportProjectContext";
import { ClientSupportResources } from "./ClientSupportResources";

export function ClientSupportView() {
  const { selectedProject } = useApp();
  const [settings, setSettings] = useState<WorkspacePublicSettings | null>(null);

  useEffect(() => {
    let alive = true;

    api.workspacePublicSettings
      .get()
      .then((data) => {
        if (alive) setSettings(data);
      })
      .catch(() => {
        if (alive) setSettings(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const activePhase = useMemo(
    () => getActiveSupportPhase(selectedProject),
    [selectedProject],
  );

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5">
        <Link
          href="/client/projects"
          className="inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-700 transition hover:text-[#0064E0]"
        >
          <ArrowLeft size={17} />
          Back to Projects
        </Link>

        <ClientSupportHero
          project={selectedProject}
          activePhase={activePhase}
          settings={settings}
        />

        <ClientSupportProjectContext
          project={selectedProject}
          activePhase={activePhase}
        />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <ClientSupportResources
            project={selectedProject}
            activePhase={activePhase}
            settings={settings}
          />

          <ClientSupportFaq settings={settings} />
        </section>
      </div>
    </main>
  );
}