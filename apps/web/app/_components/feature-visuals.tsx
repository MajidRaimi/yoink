import { Lock } from "lucide-react";

const EASE = "cubic-bezier(0.16,1,0.3,1)";

const AmbientFinish = () => (
  <>
    <div className="pointer-events-none absolute -bottom-16 -right-16 size-40 rounded-full bg-brand/[0.06] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
  </>
);

const menuRows = [0, 1, 2, 3];
const keycaps = ["↵", "n", "e", "s", "d", "q"];

export const KeyboardMenuVisual = () => (
  <div aria-hidden dir="ltr" className="relative h-40 overflow-hidden p-5">
    <div className="rounded-lg border border-foreground/[0.05] bg-foreground/[0.02] p-2">
      {menuRows.map((row) => {
        const active = row === 2;
        return (
          <div
            key={row}
            style={{ transitionDelay: `${row * 60}ms`, transitionTimingFunction: EASE }}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-[7px] transition-colors duration-500 motion-reduce:transition-none ${
              active
                ? "bg-foreground/[0.03] ring-1 ring-transparent group-hover:bg-brand/[0.10] group-hover:ring-brand/30"
                : ""
            }`}
          >
            <span
              style={{ transitionDelay: `${row * 60}ms` }}
              className={`size-1.5 rounded-full transition-colors duration-500 motion-reduce:transition-none ${
                active ? "bg-foreground/20 group-hover:bg-brand" : "bg-foreground/15"
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-500 motion-reduce:transition-none ${
                active
                  ? "w-16 bg-foreground/20 group-hover:bg-foreground/40"
                  : "w-20 bg-foreground/[0.09]"
              }`}
            />
            <span className="h-1.5 w-10 rounded-full bg-foreground/[0.06]" />
          </div>
        );
      })}
    </div>
    <div className="mt-3 flex gap-1.5">
      {keycaps.map((cap, index) => (
        <span
          key={cap}
          style={{ transitionDelay: `${index * 60 + 150}ms`, transitionTimingFunction: EASE }}
          className="flex h-6 min-w-6 items-center justify-center rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-1.5 font-mono text-[11px] text-faint transition-colors duration-500 group-hover:border-brand/30 group-hover:text-brand-text motion-reduce:transition-none"
        >
          {cap}
        </span>
      ))}
    </div>
    <AmbientFinish />
  </div>
);

const modules = ["cli", "deps", "runtime"];

export const CompiledBinaryVisual = () => (
  <div
    aria-hidden
    dir="ltr"
    className="relative flex h-40 items-center justify-center overflow-hidden p-5"
  >
    <div className="flex w-full max-w-[15rem] flex-col">
      <div className="flex justify-around px-3">
        {modules.map((label, index) => (
          <div
            key={label}
            style={{ transitionDelay: `${index * 70}ms`, transitionTimingFunction: EASE }}
            className="flex flex-col items-center transition-all duration-700 group-hover:translate-y-8 group-hover:opacity-0 motion-reduce:transition-none"
          >
            <span className="rounded-md border border-foreground/[0.08] bg-foreground/[0.03] px-2 py-1 font-mono text-[10px] text-faint">
              {label}
            </span>
            <span className="h-6 w-px bg-foreground/[0.10]" />
          </div>
        ))}
      </div>
      <div className="relative flex w-full items-center gap-2 rounded-lg border border-foreground/[0.10] bg-foreground/[0.03] px-4 py-3 transition-colors duration-500 group-hover:border-brand/40 group-hover:bg-brand/[0.08] motion-reduce:transition-none">
        <span className="font-mono text-[13px] text-faint transition-colors duration-500 group-hover:text-brand-text motion-reduce:transition-none">
          $
        </span>
        <span className="font-mono text-[13px] text-muted transition-colors duration-500 group-hover:text-foreground motion-reduce:transition-none">
          yoink
        </span>
        <span className="ml-auto rounded-md border border-foreground/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-faint opacity-0 transition-all delay-300 duration-500 group-hover:border-brand/30 group-hover:text-brand-text group-hover:opacity-100 motion-reduce:transition-none">
          1 file
        </span>
      </div>
    </div>
    <AmbientFinish />
  </div>
);

export const SecretGuardVisual = () => (
  <div aria-hidden dir="ltr" className="relative flex h-40 items-center gap-5 overflow-hidden p-5">
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 48 56" className="size-full">
        <path
          d="M24 3 L44 11 V27 C44 40 35 49 24 53 C13 49 4 40 4 27 V11 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/[0.08]"
        />
        <path
          d="M24 3 L44 11 V27 C44 40 35 49 24 53 C13 49 4 40 4 27 V11 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="150"
          strokeDashoffset="150"
          style={{ transitionTimingFunction: EASE }}
          className="text-brand-text transition-all duration-1000 group-hover:[stroke-dashoffset:0] motion-reduce:transition-none"
        />
        <path
          d="M18 27 l5 5 l8 -10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="24"
          strokeDashoffset="24"
          style={{ transitionTimingFunction: EASE }}
          className="text-emerald-500 transition-all delay-500 duration-500 group-hover:[stroke-dashoffset:0] dark:text-emerald-400 motion-reduce:transition-none"
        />
      </svg>
    </div>
    <div className="flex flex-1 flex-col gap-2">
      <span className="inline-flex items-center gap-2 self-start rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-2.5 py-1 font-mono text-[11px] text-faint transition-colors duration-500 group-hover:border-emerald-500/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 motion-reduce:transition-none">
        .gitignore ✓
      </span>
      <span
        style={{ transitionDelay: "200ms" }}
        className="inline-flex items-center gap-2 self-start rounded-md border border-foreground/[0.08] bg-foreground/[0.02] px-2.5 py-1 font-mono text-[11px] text-faint transition-colors duration-500 group-hover:border-amber-500/40 group-hover:text-amber-600 dark:group-hover:text-amber-400 motion-reduce:transition-none"
      >
        settings.json tracked · blocked
      </span>
    </div>
    <AmbientFinish />
  </div>
);

export const AtomicWriteVisual = () => (
  <div
    aria-hidden
    dir="ltr"
    className="relative flex h-40 flex-col justify-center gap-3.5 overflow-hidden p-5"
  >
    <div className="flex items-center justify-between font-mono text-[11px]">
      <span className="text-faint transition-colors duration-500 group-hover:text-muted motion-reduce:transition-none">
        profiles.json
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-foreground/[0.08] px-2 py-0.5 text-faint transition-colors duration-500 group-hover:border-brand/30 group-hover:text-brand-text motion-reduce:transition-none">
        <Lock className="size-3" /> 600
      </span>
    </div>
    <div className="h-2.5 overflow-hidden rounded-full bg-foreground/[0.05]">
      <div
        style={{ transitionTimingFunction: EASE }}
        className="h-full w-0 rounded-full bg-brand/60 transition-all duration-700 group-hover:w-full motion-reduce:transition-none"
      />
    </div>
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className="text-emerald-500 opacity-0 transition-opacity delay-700 duration-300 group-hover:opacity-100 motion-reduce:transition-none dark:text-emerald-400">
        ✓
      </span>
      <span className="text-faint opacity-0 transition-opacity delay-700 duration-300 group-hover:opacity-100 motion-reduce:transition-none">
        committed atomically
      </span>
    </div>
    <AmbientFinish />
  </div>
);
