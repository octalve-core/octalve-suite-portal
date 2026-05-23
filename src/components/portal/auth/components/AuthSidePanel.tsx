import { AUTH_COPY, type AuthMode } from "../auth-config";

export function AuthSidePanel({ mode }: { mode: AuthMode }) {
  const copy = AUTH_COPY[mode];

  return (
    <aside className="relative hidden min-h-[calc(100vh-32px)] overflow-hidden rounded-[32px] bg-[#000A16] lg:block">
      <img
        src={copy.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-[#000A16]/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(0,100,224,0.20),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(0,100,224,0.18),transparent_34%)]" />

      <div className="absolute left-1/2 top-1/2 w-[min(430px,calc(100%-80px))] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white/92 p-9 text-slate-950 shadow-[0_28px_80px_rgba(0,0,0,0.28)] backdrop-blur-md">
        <h2 className="text-[46px] font-semibold leading-[1.08] tracking-[-0.07em] text-black">
          {copy.panelTitle}
        </h2>
        <p className="mt-7 max-w-[320px] text-[22px] font-medium leading-[1.28] tracking-[-0.045em] text-black/82">
          {copy.panelBody}
        </p>
      </div>

      <div className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {[0, 1, 2].map((item) => (
          <span
            key={item}
            className={[
              "h-2.5 w-2.5 rounded-full",
              item === (mode === "login" ? 0 : mode === "signup" ? 1 : 2)
                ? "bg-white"
                : "bg-white/55",
            ].join(" ")}
          />
        ))}
      </div>
    </aside>
  );
}
