import { Bell, MessageSquareText } from "lucide-react";

type ActivityItem = {
  id: string;
  message: string;
  createdAt: string;
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

export function ClientRecentActivity({ messages }: { messages: ActivityItem[] }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.055)]">
      <div className="border-b border-slate-100 p-5">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
          Recent Activity
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Latest visible project messages.
        </p>
      </div>

      <div className="grid gap-3 p-4">
        {messages.length ? (
          messages.map((message) => (
            <article
              key={message.id}
              className="rounded-3xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
                  <MessageSquareText size={18} />
                </span>

                <div className="min-w-0">
                  <p className="m-0 line-clamp-2 text-sm font-semibold leading-6 text-slate-800">
                    {message.message}
                  </p>
                  <span className="mt-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    {formatActivityDate(message.createdAt)}
                  </span>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="grid min-h-40 place-items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <div>
              <Bell className="mx-auto text-slate-400" size={24} />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No recent project activity yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
