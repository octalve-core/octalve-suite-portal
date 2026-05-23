import type { ProjectDetailTab } from "./client-project-detail-utils";

const TABS: Array<{ value: ProjectDetailTab; label: string }> = [
  { value: "phases", label: "Phases" },
  { value: "team", label: "Team" },
  { value: "notes", label: "Notes" },
];

export function ClientProjectDetailTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: ProjectDetailTab;
  setActiveTab: (tab: ProjectDetailTab) => void;
}) {
  return (
    <div className="flex gap-6 border-b border-slate-200">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => setActiveTab(tab.value)}
          className={[
            "-mb-px min-h-12 border-b-2 px-1 text-sm font-bold transition",
            activeTab === tab.value
              ? "border-[#0064E0] text-[#0064E0]"
              : "border-transparent text-slate-500 hover:text-slate-950",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
