import Link from "next/link";
import { ArrowRight, Bell, MessageSquareText } from "lucide-react";

type ActivityItem = {
  id: string;
  message: string;
  createdAt: string;
  senderName?: string | null;
  senderRole?: string | null;
};

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Recently";

  return date.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initial(value?: string | null) {
  return (value?.trim()?.[0] ?? "O").toUpperCase();
}

export function ClientRecentActivity({
  messages,
  totalCount,
}: {
  messages: ActivityItem[];
  totalCount?: number;
}) {
  const count = totalCount ?? messages.length;

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.025)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
            Recent Activity
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Latest visible project messages.
          </p>
        </div>

        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
          <Bell size={18} />
        </span>
      </div>

      <div className="p-4">
        {messages.length ? (
          <div className="grid gap-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-[#0064E0] ring-1 ring-blue-100">
                    {initial(message.senderName)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm font-semibold text-slate-950">
                        {message.senderName ?? "Workspace update"}
                      </strong>

                      {message.senderRole ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                          {message.senderRole.replaceAll("_", " ")}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs font-medium leading-5 text-slate-600">
                      {message.message}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                      <MessageSquareText size={12} />
                      {formatActivityDate(message.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
              <MessageSquareText size={20} />
            </span>

            <strong className="mt-3 block text-sm font-semibold text-slate-950">
              No recent messages
            </strong>

            <p className="mx-auto mt-1 max-w-[240px] text-xs font-medium leading-5 text-slate-500">
              Messages and activity updates will appear here.
            </p>
          </div>
        )}

        <Link
          href="/client/phases"
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#0064E0] transition hover:border-blue-200 hover:bg-blue-50"
        >
          {count > messages.length ? `View All Activity (${count})` : "View All Activity"}
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}