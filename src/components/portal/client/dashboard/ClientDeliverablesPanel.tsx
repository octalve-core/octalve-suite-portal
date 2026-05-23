import { ExternalLink, FileCheck2 } from "lucide-react";

type LinkItem = {
  id: string;
  name: string;
  link?: string | null;
  linkType?: string | null;
};

export function ClientDeliverablesPanel({ links }: { links: LinkItem[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Key Links
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Client-visible deliverables and resources.
        </p>
      </div>

      <div className="grid gap-3 p-4">
        {links.length ? (
          links.map((link) => (
            <a
              key={link.id}
              href={link.link ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="group rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-purple-50 text-purple-700 ring-1 ring-purple-100">
                  <FileCheck2 size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-slate-950">
                    {link.name}
                  </strong>
                  <span className="mt-1 block text-sm font-medium text-slate-500">
                    {link.linkType ?? "Deliverable"}
                  </span>
                </div>

                <ExternalLink
                  size={16}
                  className="mt-1 text-slate-400 transition group-hover:text-[#0064E0]"
                />
              </div>
            </a>
          ))
        ) : (
          <div className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
                <FileCheck2 size={22} />
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-slate-950">
                No links yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
                Deliverable links will appear here when the delivery team makes them visible.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
