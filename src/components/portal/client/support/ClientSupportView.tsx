"use client";

import { useMemo } from "react";

import { useApp } from "../../AppContext";
import {
  getActiveSupportPhase,
  getProjectManager,
} from "./client-support-utils";
import { ClientSupportContactCards } from "./ClientSupportContactCards";
import { ClientSupportFaq } from "./ClientSupportFaq";
import { ClientSupportHero } from "./ClientSupportHero";
import { ClientSupportProjectContext } from "./ClientSupportProjectContext";
import { ClientSupportResources } from "./ClientSupportResources";

export function ClientSupportView() {
  const { selectedProject, state } = useApp();

  const activePhase = useMemo(
    () => getActiveSupportPhase(selectedProject),
    [selectedProject],
  );

  const projectManager = useMemo(
    () => getProjectManager(selectedProject, state.users),
    [selectedProject, state.users],
  );

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6">
        <ClientSupportHero
          project={selectedProject}
          activePhase={activePhase}
          projectManager={projectManager}
        />

        <ClientSupportContactCards
          project={selectedProject}
          activePhase={activePhase}
          projectManager={projectManager}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="grid gap-6">
            <ClientSupportProjectContext
              project={selectedProject}
              activePhase={activePhase}
            />

            <ClientSupportResources />
          </div>

          <ClientSupportFaq />
        </section>
      </div>
    </main>
  );
}
