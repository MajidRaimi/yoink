import { InlineCode } from "@/shared/ui/code";
import { Kbd } from "@/shared/ui/kbd";
import { HARNESS_ID_ROWS, MENU_KEYMAP, PRESET_ID_ROWS, TOOL_IDS } from "../ids";
import { ID_SECTIONS } from "../sections";
import { ProtocolList } from "./protocol-list";
import { SectionHeading } from "./section-heading";

const idGridClass = "grid gap-px overflow-hidden rounded-lg border border-hairline bg-hairline sm:grid-cols-2";

const idCellClass = "flex min-w-0 flex-col gap-2 bg-background p-4";

export const KeymapSection = (): React.JSX.Element => (
  <section aria-labelledby={ID_SECTIONS.keymap.id}>
    <SectionHeading id={ID_SECTIONS.keymap.id} title={ID_SECTIONS.keymap.title}>
      Keys handled by the interactive menu that opens when you run <InlineCode>yoink</InlineCode> with no arguments.
    </SectionHeading>
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
      {MENU_KEYMAP.map((binding) => (
        <div key={binding.label} className="contents">
          <dt className="flex flex-wrap items-center gap-1.5" aria-label={binding.label}>
            {binding.keys.map((key) => (
              <Kbd key={key} size="md">
                {key}
              </Kbd>
            ))}
          </dt>
          <dd className="mb-2 text-muted sm:mb-0">{binding.action}</dd>
        </div>
      ))}
    </dl>
  </section>
);

export const ToolIdsSection = (): React.JSX.Element => (
  <section aria-labelledby={ID_SECTIONS.tools.id}>
    <SectionHeading id={ID_SECTIONS.tools.id} title={ID_SECTIONS.tools.title}>
      Values for <InlineCode>--tool</InlineCode> on <InlineCode>yoink save</InlineCode> and{" "}
      <InlineCode>yoink current</InlineCode>. Each tool keeps its own active login.
    </SectionHeading>
    <ul className={idGridClass}>
      {TOOL_IDS.map((tool) => (
        <li key={tool.id} className={idCellClass}>
          <span className="font-mono text-sm font-medium tracking-mono">{tool.id}</span>
          <span className="text-sm text-muted">{tool.label}</span>
        </li>
      ))}
    </ul>
  </section>
);

export const HarnessIdsSection = (): React.JSX.Element => (
  <section aria-labelledby={ID_SECTIONS.harnesses.id}>
    <SectionHeading id={ID_SECTIONS.harnesses.id} title={ID_SECTIONS.harnesses.title}>
      Values for <InlineCode>--connect</InlineCode>, <InlineCode>--to</InlineCode> and <InlineCode>--from</InlineCode>,
      with the protocols each harness can speak.
    </SectionHeading>
    <ul className={idGridClass}>
      {HARNESS_ID_ROWS.map((harness) => (
        <li key={harness.id} className={idCellClass}>
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-medium tracking-mono">{harness.id}</span>
            <span className="text-sm text-muted">{harness.label}</span>
            {harness.experimental ? (
              <span className="rounded-pill border border-hairline-strong px-2 text-xs text-muted">Experimental</span>
            ) : null}
          </span>
          <ProtocolList protocols={harness.protocols} />
        </li>
      ))}
    </ul>
  </section>
);

export const PresetIdsSection = (): React.JSX.Element => (
  <section aria-labelledby={ID_SECTIONS.presets.id}>
    <SectionHeading id={ID_SECTIONS.presets.id} title={ID_SECTIONS.presets.title}>
      Values for <InlineCode>--preset</InlineCode> on <InlineCode>yoink add</InlineCode> and{" "}
      <InlineCode>yoink probe</InlineCode>. <InlineCode>yoink presets --json</InlineCode> prints the same list as
      JSON.
    </SectionHeading>
    <ul className={idGridClass}>
      {PRESET_ID_ROWS.map((preset) => (
        <li key={preset.id} className={idCellClass}>
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-medium tracking-mono">{preset.id}</span>
            <span className="text-sm text-muted">{preset.label}</span>
          </span>
          <ProtocolList protocols={preset.protocols} />
        </li>
      ))}
    </ul>
  </section>
);
