import { Bell, MessageSquareText } from "lucide-react";

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

export function ClientRecentActivity({ messages }: { messages: ActivityItem[] }) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Latest visible project messages.
          </p>
        </div>

        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
          <Bell size={20} />
        </span>
      </div>

      <div className="p-4">
        {messages.length ? (
          <div className="grid gap-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-black text-[#0064E0] ring-1 ring-blue-100">
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

                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-600">
                      {message.message}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <MessageSquareText size={13} />
                      {formatActivityDate(message.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-200">
              <MessageSquareText size={22} />
            </span>

            <strong className="mt-4 block text-base font-semibold text-slate-950">
              No recent messages
            </strong>

            <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Project messages and activity updates will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}