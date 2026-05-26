import Link from "next/link";
import { ExternalLink, FileCheck2, Link2 } from "lucide-react";

type LinkItem = {
  id: string;
  name: string;
  link?: string | null;
  linkType?: string | null;
  description?: string | null;
};

export function ClientDeliverablesPanel({ links }: { links: LinkItem[] }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Deliverable Links
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Client-visible deliverables and resources.
          </p>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <FileCheck2 size={20} />
        </span>
      </div>

      <div className="p-4">
        {links.length ? (
          <div className="grid gap-3">
            {links.slice(0, 5).map((item) => (
              <a
                key={item.id}
                href={item.link ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-[#0064E0] ring-1 ring-slate-200 group-hover:bg-white group-hover:ring-blue-100">
                    <Link2 size={17} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-semibold text-slate-950">
                      {item.name}
                    </strong>

                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                        {item.description}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                        {item.linkType ?? "Project resource"}
                      </p>
                    )}
                  </div>

                  <ExternalLink
                    size={16}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:text-[#0064E0]"
                  />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
              <FileCheck2 size={22} />
            </span>

            <strong className="mt-4 block text-base font-semibold text-slate-950">
              No visible links yet
            </strong>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Deliverable links will appear here once the Octalve team shares them.
            </p>
          </div>
        )}

        {links.length > 5 ? (
          <Link
            href="/client/phases"
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 text-sm font-bold text-[#0064E0] transition hover:bg-blue-100"
          >
            View all deliverables
            <ExternalLink size={15} />
          </Link>
        ) : null}
      </div>
    </section>
  );
}