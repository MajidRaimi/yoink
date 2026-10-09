import { describe, expect, test } from "bun:test";
import type { DemoEvent, DemoKey } from "@/shared/contract";
import { computeFinal, computeFrames, scriptDuration } from "@/features/demos/engine/frames";
import {
  ACTIVE_CLAUDE_PROFILE,
  ACTIVE_SUBSCRIPTIONS,
  CLAUDE_PROFILES,
  SUBSCRIPTION_LOGINS,
} from "@/features/demos/data/fixtures";
import { SUBSCRIPTIONS } from "@/features/demos/data/subscriptions.gen";
import { subscriptionSwitchDemo } from "@/features/demos/subscription-switch/definition";
import {
  currentTool,
  eventsToAnswer,
  eventsToRow,
  eventsToTab,
  initial,
  logLines,
  loginsFor,
  MAX_LOGINS,
  reduce,
  restartHint,
  runningPrompt,
  runningSummary,
  statusText,
  TOOLS,
  type SwitchState,
  type SwitchTool,
} from "@/features/demos/subscription-switch/machine";

const key = (name: DemoKey): DemoEvent => ({ type: "key", key: name });
const text = (value: string): DemoEvent => ({ type: "text", value });
const run = (events: readonly DemoEvent[], from: SwitchState = initial): SwitchState => events.reduce(reduce, from);
const texts = (state: SwitchState): string[] => logLines(state).map((line) => line.text);

const CODEX_TAB = TOOLS.indexOf("codex");
const firstInactiveClaude = CLAUDE_PROFILES.findIndex((profile) => profile.name !== ACTIVE_CLAUDE_PROFILE);
const activeClaudeIndex = CLAUDE_PROFILES.findIndex((profile) => profile.name === ACTIVE_CLAUDE_PROFILE);

const onCodex = (): SwitchState => run(eventsToTab(initial, CODEX_TAB));

describe("tools and logins", () => {
  test("tabs are Claude Code followed by every generated subscription", () => {
    expect(TOOLS).toEqual(["claude", ...SUBSCRIPTIONS.map((subscription) => subscription.tool)]);
  });

  test("each tab lists that tool's fixture logins", () => {
    expect(loginsFor("claude").map((login) => login.name)).toEqual(CLAUDE_PROFILES.map((profile) => profile.name));
    for (const subscription of SUBSCRIPTIONS) {
      expect(loginsFor(subscription.tool).map((login) => login.name)).toEqual(
        SUBSCRIPTION_LOGINS.filter((login) => login.tool === subscription.tool).map((login) => login.name),
      );
    }
    expect(MAX_LOGINS).toBeGreaterThanOrEqual(loginsFor("claude").length);
  });

  test("initial state starts on the active Claude login with nothing running", () => {
    expect(currentTool(initial)).toBe("claude");
    expect(initial.cursor).toBe(activeClaudeIndex);
    expect(initial.active.claude).toBe(ACTIVE_CLAUDE_PROFILE);
    expect(initial.active.codex).toBe(ACTIVE_SUBSCRIPTIONS.codex ?? null);
    expect(Object.values(initial.running).every((running) => !running)).toBe(true);
    expect(logLines(initial)).toEqual([]);
  });
});

describe("browse", () => {
  test("right and left move between tools and wrap", () => {
    expect(currentTool(run([key("right")]))).toBe(TOOLS[1] ?? "claude");
    expect(currentTool(run([key("left")]))).toBe(TOOLS.at(-1) ?? "claude");
    expect(run([key("right"), key("left")]).tab).toBe(0);
  });

  test("changing tool puts the cursor on that tool's active login", () => {
    const state = onCodex();
    const activeCodex = loginsFor("codex").findIndex((login) => login.name === ACTIVE_SUBSCRIPTIONS.codex);
    expect(state.cursor).toBe(Math.max(0, activeCodex));
  });

  test("up and down move the cursor and wrap", () => {
    const count = loginsFor("claude").length;
    expect(run([key("down")]).cursor).toBe((initial.cursor + 1) % count);
    expect(run([key("up")]).cursor).toBe((initial.cursor - 1 + count) % count);
  });

  test("up and down do nothing on a tool with no saved logins", () => {
    const empty = TOOLS.findIndex((tool) => loginsFor(tool).length === 0);
    if (empty === -1) return;
    const state = run(eventsToTab(initial, empty));
    expect(run([key("down")], state)).toBe(state);
    expect(run([key("enter")], state)).toBe(state);
    expect(statusText(state)).toContain("No saved");
  });

  test("space toggles only the current tool's running flag", () => {
    const state = run([key("space")]);
    expect(state.running.claude).toBe(true);
    expect(state.running.codex).toBe(false);
    expect(run([key("space")], state).running.claude).toBe(false);
  });

  test("text, escape and unused keys are ignored while browsing", () => {
    expect(run([text("x")])).toBe(initial);
    expect(run([key("escape")])).toBe(initial);
    expect(run([key("tab")])).toBe(initial);
    expect(run([key("backspace")])).toBe(initial);
  });

  test("reset returns the initial state", () => {
    expect(run([key("down"), key("enter"), { type: "reset" }])).toBe(initial);
  });
});

describe("switching", () => {
  test("enter on the active login reports it unchanged", () => {
    const state = run([key("enter")]);
    expect(state.active).toEqual(initial.active);
    expect(state.outcome.kind).toBe("unchanged");
    expect(texts(state)).toEqual([`Already on ${ACTIVE_CLAUDE_PROFILE}.`]);
    expect(statusText(state)).toStartWith(`Already on ${ACTIVE_CLAUDE_PROFILE}. `);
  });

  test("a Claude switch re-snapshots, writes credentials and restores oauthAccount", () => {
    const state = run(eventsToRow(initial, firstInactiveClaude));
    const profile = CLAUDE_PROFILES[firstInactiveClaude];
    const target = profile?.name ?? "";
    expect(state.active.claude).toBe(target);
    expect(texts(state)).toEqual([
      `Re-snapshot ${ACTIVE_CLAUDE_PROFILE} from the live login`,
      "Write the Claude Code-credentials Keychain entry, or ~/.claude/.credentials.json",
      `Restore oauthAccount for ${target} in ~/.claude.json`,
      `Switched to ${target} (${profile?.email ?? ""})`,
      restartHint("claude"),
    ]);
  });

  const switchedTo = (tool: SwitchTool, previous: string | null): SwitchState => ({
    ...initial,
    tab: TOOLS.indexOf(tool),
    outcome: { kind: "switched", tool, name: "spare", previous },
    run: 1,
  });

  test.each([
    [
      "codex",
      "Re-capture ~/.codex/auth.json (or the Codex keyring entry) into personal",
      "Restore ~/.codex/auth.json (or the Codex keyring entry) from spare",
    ],
    ["kimi", "Re-capture ~/.kimi-code/credentials/*.json into personal", "Restore ~/.kimi-code/credentials/*.json from spare"],
    [
      "gemini",
      "Re-capture ~/.gemini/oauth_creds.json and google_accounts.json into personal",
      "Restore ~/.gemini/oauth_creds.json and google_accounts.json from spare",
    ],
    [
      "copilot",
      "Re-capture last_logged_in_user in ~/.copilot/config.json into personal",
      "Set last_logged_in_user in ~/.copilot/config.json to spare",
    ],
  ] as const)("a %s switch re-captures and restores its own files", (tool: SwitchTool, capture: string, restore: string) => {
    expect(texts(switchedTo(tool, "personal"))).toEqual([capture, restore, "Switched to spare (spare)", restartHint(tool)]);
    expect(texts(switchedTo(tool, null))).toEqual([restore, "Switched to spare (spare)", restartHint(tool)]);
  });

  test("a switch through the fixtures uses each fixture login's detail", () => {
    for (const tool of TOOLS.filter((candidate) => candidate !== "claude")) {
      const logins = loginsFor(tool);
      const target = logins[0];
      if (target === undefined) continue;
      const base: SwitchState = {
        ...run(eventsToTab(initial, TOOLS.indexOf(tool))),
        active: { ...initial.active, [tool]: "previous" },
      };
      const state = run(eventsToRow(base, 0), base);
      expect(state.active[tool]).toBe(target.name);
      expect(texts(state).at(-2)).toBe(`Switched to ${target.name} (${target.detail})`);
    }
  });

  test("cursor moves are announced in the status", () => {
    const state = run([key("down")]);
    const profile = CLAUDE_PROFILES[state.cursor];
    const suffix = profile?.name === ACTIVE_CLAUDE_PROFILE ? ", active" : "";
    expect(statusText(state)).toBe(`Claude Code: ${profile?.name ?? ""} (${profile?.email ?? ""})${suffix}. Enter switches. Claude Code not running.`);
    expect(statusText(initial)).toContain(", active. Enter switches.");
    const cancelled = run([key("down")], run([key("escape")], run([key("down"), key("space"), key("enter")], onCodex())));
    const codexLogin = loginsFor("codex")[cancelled.cursor];
    expect(cancelled.outcome.kind).toBe("cancelled");
    expect(statusText(cancelled)).toContain(`${codexLogin?.name ?? ""} (${codexLogin?.detail ?? ""})`);
  });

  test("toggling running is announced in the status", () => {
    const toggled = run([key("space")], onCodex());
    expect(statusText(onCodex())).toEndWith(runningSummary(onCodex(), "codex"));
    expect(statusText(onCodex())).toEndWith("not running.");
    expect(statusText(toggled)).toEndWith("marked running.");
    expect(statusText(run([key("space")], toggled))).toEndWith("not running.");
  });

  test("a switch with no active login skips the re-capture step", () => {
    const base: SwitchState = { ...onCodex(), active: { ...initial.active, codex: null } };
    const state = run([key("enter")], base);
    expect(texts(state)[0]).toStartWith("Restore ~/.codex/auth.json (or the Codex keyring entry) from");
  });

  test("the restart hints name each tool", () => {
    expect(restartHint("codex")).toBe("Restart Codex to pick up the new login.");
    expect(restartHint("gemini")).toBe("Restart the Gemini CLI to pick up the new login.");
    expect(restartHint("copilot")).toBe("Restart the Copilot CLI to pick up the new login.");
  });
});

describe("running guard", () => {
  const confirming = (): SwitchState => run([key("down"), key("space"), key("enter")], onCodex());

  test("enter while the tool runs asks for confirmation with No selected", () => {
    const state = confirming();
    expect(state.phase).toEqual({ kind: "confirm", target: loginsFor("codex")[1]?.name ?? "", choice: "no" });
    expect(statusText(state)).toContain(runningPrompt("codex"));
  });

  test("the prompts match the CLI wording", () => {
    expect(runningPrompt("claude")).toBe(
      "Claude Code is running. It may overwrite the token on its next refresh. Switch anyway?",
    );
    expect(runningPrompt("codex")).toBe(
      "ChatGPT (Codex) is running. It may overwrite the login on its next refresh. Switch anyway?",
    );
  });

  test("arrows flip the choice and enter on No cancels", () => {
    const state = confirming();
    const flipped = run([key("left")], state);
    expect(flipped.phase).toMatchObject({ choice: "yes" });
    expect(run([key("right")], flipped).phase).toMatchObject({ choice: "no" });
    expect(run([key("up")], state).phase).toMatchObject({ choice: "yes" });
    expect(run([key("down")], state).phase).toMatchObject({ choice: "yes" });
    const cancelled = run([key("enter")], state);
    expect(cancelled.phase.kind).toBe("browse");
    expect(cancelled.active.codex).toBe(initial.active.codex);
    expect(texts(cancelled).at(-1)).toBe("Switch cancelled.");
  });

  test("enter on Yes switches", () => {
    const state = run([key("left"), key("enter")], confirming());
    expect(state.active.codex).toBe(loginsFor("codex")[1]?.name ?? "");
    expect(state.outcome.kind).toBe("switched");
  });

  test("y and n answer directly, escape cancels, other input is ignored", () => {
    const state = confirming();
    expect(run([text("y")], state).outcome.kind).toBe("switched");
    expect(run([text("N")], state).outcome.kind).toBe("cancelled");
    expect(run([key("escape")], state).outcome.kind).toBe("cancelled");
    expect(run([text("q")], state)).toBe(state);
    expect(run([key("space")], state)).toBe(state);
  });

  test("tabs, rows and answers map to events only in the right phase", () => {
    const state = confirming();
    expect(eventsToTab(state, 0)).toEqual([]);
    expect(eventsToRow(state, 0)).toEqual([]);
    expect(eventsToAnswer(state, "yes")).toEqual([text("y")]);
    expect(eventsToAnswer(initial, "yes")).toEqual([]);
    expect(eventsToTab(onCodex(), 0)).toEqual([key("left")]);
    expect(eventsToRow(initial, initial.cursor)).toEqual([key("enter")]);
    expect(eventsToRow({ ...initial, cursor: 2 }, 0)).toEqual([key("up"), key("up"), key("enter")]);
  });
});

describe("script", () => {
  test("finishes under 15 seconds", () => {
    expect(scriptDuration(subscriptionSwitchDemo.script)).toBeLessThan(15000);
  });

  test("switches Claude, declines a running Codex switch, then switches Codex", () => {
    const frames = computeFrames(subscriptionSwitchDemo);
    expect(frames.some((frame) => frame.phase.kind === "confirm")).toBe(true);
    expect(frames.some((frame) => frame.outcome.kind === "cancelled" && frame.outcome.tool === "codex")).toBe(true);
    const final = computeFinal(subscriptionSwitchDemo);
    expect(currentTool(final)).toBe("codex");
    expect(final.active.claude).not.toBe(ACTIVE_CLAUDE_PROFILE);
    expect(final.active.codex).not.toBe(ACTIVE_SUBSCRIPTIONS.codex);
    expect(final.running.codex).toBe(false);
    expect(final.phase.kind).toBe("browse");
    expect(final.outcome).toMatchObject({ kind: "switched", tool: "codex" });
    expect(texts(final).at(-1)).toBe(restartHint("codex"));
  });
});
