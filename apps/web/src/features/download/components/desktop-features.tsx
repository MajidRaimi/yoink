import { docHref } from "@/shared/lib/routes";
import { TextLink } from "@/shared/ui/link";

type DesktopFeature = {
  title: string;
  body: string;
};

const FEATURES: readonly DesktopFeature[] = [
  {
    title: "Switch Claude Code accounts in one click.",
    body: "Pick a profile from the menu bar. If Claude Code is running, the app asks before it switches.",
  },
  {
    title: "Save or add a login.",
    body: "Save the account you are signed in with as a named profile, or sign in to a new one from the built-in terminal.",
  },
  {
    title: "Connect a provider.",
    body: "The wizard walks you from a preset or any compatible API, to your key, to the models, to a checklist of coding tools to connect.",
  },
  {
    title: "Stay out of the way.",
    body: "Toggle the panel from anywhere with a global shortcut, start it when you log in, and check for updates from the tray menu and install them in place.",
  },
];

export const DesktopFeatures = (): React.JSX.Element => (
  <div className="flex flex-col gap-5">
    <h3 className="text-lg font-semibold tracking-tight">What the menu bar app does</h3>
    <dl className="flex flex-col gap-4">
      {FEATURES.map((feature) => (
        <div key={feature.title} className="flex flex-col gap-1 border-t border-hairline pt-4">
          <dt className="font-medium text-foreground">{feature.title}</dt>
          <dd className="text-sm text-muted">{feature.body}</dd>
        </div>
      ))}
    </dl>
    <p className="text-sm text-muted">
      Codex, Kimi, Gemini and Copilot logins switch from the CLI.{" "}
      <TextLink href={docHref("desktop")}>How the app works</TextLink>
    </p>
  </div>
);
