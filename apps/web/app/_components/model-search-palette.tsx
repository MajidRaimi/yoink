import { Search } from "lucide-react";
import { Kbd } from "@/components/custom/kbd";
import { cn } from "@/lib/utils";

const results = [
  { id: "z-ai/glm-4.7", selected: true },
  { id: "z-ai/glm-4.7-air" },
  { id: "z-ai/glm-4.6" },
  { id: "thudm/glm-4-9b" },
];

export const ModelSearchPalette = () => (
  <div className="overflow-hidden rounded-xl border border-hairline-strong bg-background shadow-xl shadow-black/10 dark:shadow-black/50">
    <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5 font-mono text-xs">
      <span className="text-muted">add provider · OpenRouter</span>
      <span className="text-green-500 dark:text-green-400">✔ key valid</span>
    </div>
    <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3">
      <Search className="size-4 shrink-0 text-faint" />
      <span className="font-mono text-sm text-foreground">glm</span>
      <span className="ml-auto font-mono text-xs text-faint">412 models</span>
    </div>
    <ul className="space-y-0.5 p-1.5">
      {results.map((model) => (
        <li
          key={model.id}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-mono text-[13px]",
            model.selected ? "bg-brand/10 text-foreground" : "text-muted",
          )}
        >
          <span className={model.selected ? "text-brand-text" : "text-faint"}>
            {model.selected ? "●" : "○"}
          </span>
          <bdi>{model.id}</bdi>
          {model.selected && (
            <span className="ml-auto font-mono text-[11px] text-brand-text">selected</span>
          )}
        </li>
      ))}
    </ul>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline px-4 py-2.5 font-mono text-[11px] text-faint">
      <span className="flex items-center gap-1.5">
        <Kbd>↑</Kbd>
        <Kbd>↓</Kbd> navigate
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>↵</Kbd> select
      </span>
      <span className="flex items-center gap-1.5">
        <Kbd>esc</Kbd> cancel
      </span>
    </div>
  </div>
);
