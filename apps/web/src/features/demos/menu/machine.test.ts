import { describe, expect, test } from "bun:test";
import type { DemoEvent } from "@/shared/contract";
import { PROFILE_GROUP_TITLES } from "@/features/demos/data/groups.gen";
import { computeFinal, foldSteps, scriptDuration } from "@/features/demos/engine/frames";
import { menuDefinition } from "@/features/demos/menu/definition";
import { enterLabelFor, helpItems, menuHints, outcomeLines, restartHint, statusText } from "@/features/demos/menu/format";
import {
  cursorForCurrent,
  eventsToPick,
  highlightedProfile,
  initial,
  isCurrentProfile,
  reduce,
  type MenuState,
} from "@/features/demos/menu/machine";
import { MENU_GROUPS, MENU_PROFILES, type MenuProfile } from "@/features/demos/menu/profiles";

const key = (name: "up" | "down" | "enter" | "escape" | "left" | "space"): DemoEvent => ({ type: "key", key: name });

const run = (events: readonly DemoEvent[], from: MenuState = initial): MenuState =>
  events.reduce((state, event) => reduce(state, event), from);

const indexOf = (group: MenuProfile["group"], name: string): number =>
  MENU_PROFILES.findIndex((profile) => profile.group === group && profile.name === name);

const at = (index: number): MenuState => ({ ...initial, cursor: index });

const profileAt = (index: number): MenuProfile => {
  const profile = MENU_PROFILES[index];
  if (profile === undefined) throw new Error(`no profile at ${index}`);
  return profile;
};

describe("menu rows", () => {
  test("groups follow the CLI order with CLI titles", () => {
    const titles = MENU_GROUPS.map((group) => group.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        PROFILE_GROUP_TITLES.claude,
        PROFILE_GROUP_TITLES.external,
        PROFILE_GROUP_TITLES.codex,
        PROFILE_GROUP_TITLES.gemini,
      ]),
    );
    expect(titles.indexOf(PROFILE_GROUP_TITLES.claude)).toBe(0);
    expect(titles.indexOf(PROFILE_GROUP_TITLES.external)).toBe(1);
    expect(titles.indexOf(PROFILE_GROUP_TITLES.codex)).toBe(2);
  });

  test("row ids are unique even when names repeat across tools", () => {
    const ids = MENU_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("hints mirror accountLabel", () => {
    expect(profileAt(indexOf("external", "fuse")).hint).toBe("Fuse · 6 models");
    expect(profileAt(indexOf("codex", "codex-work")).hint).toBe("sara.haddad@lumenlabs.example · team");
    expect(profileAt(indexOf("gemini", "gemini")).hint).toBe("sara@haddad.example");
  });
});

describe("menu machine", () => {
  test("opens with the cursor on the current Claude profile", () => {
    expect(initial.open).toBe(true);
    expect(highlightedProfile(initial)?.name).toBe("work");
    expect(highlightedProfile(initial)?.group).toBe("claude");
  });

  test("down and up move the cursor and wrap at both ends", () => {
    expect(run([key("down")]).cursor).toBe(initial.cursor + 1);
    expect(run([key("up")], at(0)).cursor).toBe(MENU_PROFILES.length - 1);
    expect(run([key("down")], at(MENU_PROFILES.length - 1)).cursor).toBe(0);
  });

  test("Enter on another Claude account switches it and keeps other tools", () => {
    const state = run([key("enter")], at(indexOf("claude", "side")));
    expect(state.current).toBe("side");
    expect(state.currentByTool).toEqual(initial.currentByTool);
    expect(state.outcome).toEqual({ kind: "switched", profileId: profileAt(indexOf("claude", "side")).id });
    expect(state.cursor).toBe(indexOf("claude", "side"));
    expect(statusText(state)).toBe(
      "Switched to side (builds@quietharbor.example). Restart Claude Code to pick up the new login.",
    );
  });

  test("Enter on the current Claude account changes nothing", () => {
    const state = run([key("enter")]);
    expect(state.current).toBe(initial.current);
    expect(state.notice.kind).toBe("unchanged");
    expect(outcomeLines(state)).toEqual({ kind: "empty" });
    expect(statusText(state)).toBe("work is already the active Claude Code login. Nothing changed.");
  });

  test("Enter on the active row keeps the earlier outcome lines and resets the cursor", () => {
    const switched = run([key("enter")], at(indexOf("claude", "side")));
    const again = run([key("up"), key("down"), key("enter")], switched);
    expect(again.outcome).toEqual(switched.outcome);
    expect(outcomeLines(again)).toEqual(outcomeLines(switched));
    expect(again.cursor).toBe(cursorForCurrent("side"));
    expect(again.notice.kind).toBe("unchanged");
    expect(run([key("down")], again).notice.kind).toBe("none");
  });

  test("Enter on a Codex login moves the marker only within its group", () => {
    const target = indexOf("codex", "codex-personal");
    const state = run([key("enter")], at(target));
    expect(state.currentByTool.codex).toBe("codex-personal");
    expect(state.currentByTool.kimi).toBe(initial.currentByTool.kimi);
    expect(state.current).toBe(initial.current);
    expect(isCurrentProfile(state, profileAt(indexOf("codex", "codex-work")))).toBe(false);
    expect(isCurrentProfile(state, profileAt(indexOf("claude", "work")))).toBe(true);
    expect(state.cursor).toBe(cursorForCurrent(initial.current));
    expect(statusText(state)).toContain("Restart Codex to pick up the new login.");
  });

  test("Enter on the current subscription login changes nothing", () => {
    const state = run([key("enter")], at(indexOf("codex", "codex-work")));
    expect(state.currentByTool).toEqual(initial.currentByTool);
    expect(state.outcome).toEqual(initial.outcome);
    expect(state.notice.kind).toBe("unchanged");
    expect(state.cursor).toBe(cursorForCurrent(initial.current));
  });

  test("Enter on a provider shows the connect step without switching", () => {
    const fuse = profileAt(indexOf("external", "fuse"));
    const state = run([key("enter")], at(indexOf("external", "fuse")));
    expect(state.current).toBe(initial.current);
    expect(state.outcome).toEqual({ kind: "connect", profileId: fuse.id });
    expect(outcomeLines(state)).toEqual({ kind: "connect", profile: fuse });
    expect(statusText(state)).toBe(
      "fuse is a provider. In yoink, Enter opens the harness checklist: Connect to which harnesses?",
    );
  });

  test("n, e, s and d explain the CLI flow they open without changing the menu", () => {
    const text = (value: string): DemoEvent => ({ type: "text", value });
    const cursor = indexOf("claude", "personal");
    expect(statusText(run([text("n")], at(cursor)))).toBe(
      "In yoink, n opens the add-account flow. This demo only switches and connects.",
    );
    expect(statusText(run([text("e")], at(cursor)))).toBe(
      "In yoink, e opens the edit flow for personal. This demo only switches and connects.",
    );
    expect(statusText(run([text("s")], at(cursor)))).toBe(
      "In yoink, s saves the login you are signed in with. This demo only switches and connects.",
    );
    expect(statusText(run([text("d")], at(cursor)))).toBe(
      "In yoink, d asks to delete personal. This demo only switches and connects.",
    );
    const noticed = run([text("d")], at(cursor));
    expect(noticed.cursor).toBe(cursor);
    expect(noticed.current).toBe(initial.current);
    expect(noticed.outcome).toEqual(initial.outcome);
    expect(statusText(run([key("down")], noticed))).not.toContain("This demo");
    expect(run([text("q")], noticed).notice.kind).toBe("none");
  });

  test("the Enter label reads connect on provider rows and switch elsewhere", () => {
    expect(enterLabelFor(profileAt(indexOf("external", "openrouter")))).toBe("connect");
    expect(enterLabelFor(profileAt(indexOf("claude", "work")))).toBe("switch");
    expect(enterLabelFor(profileAt(indexOf("kimi", "kimi")))).toBe("switch");
    expect(enterLabelFor(undefined)).toBe("new");
    expect(helpItems("connect").map((item) => `${item.key} ${item.label}`)).toEqual([
      "↑↓/jk move",
      "↵ connect",
      "n new",
      "e edit",
      "s save",
      "d delete",
      "q quit",
    ]);
  });

  test("q and Escape collapse the menu", () => {
    expect(run([{ type: "text", value: "q" }]).open).toBe(false);
    expect(run([key("escape")]).open).toBe(false);
    expect(statusText(run([key("escape")]))).toBe("Menu closed. Press Enter to run yoink again.");
    expect(menuHints(run([key("escape")]))).toEqual([{ keys: ["Enter"], action: "run yoink" }]);
  });

  test("open hints stay short and leave quit to the help line", () => {
    expect(menuHints(initial)).toEqual([
      { keys: ["j", "k"], action: "move" },
      { keys: ["Enter"], action: "switch" },
    ]);
  });

  test("a closed menu ignores everything but Enter, which reopens at the current profile", () => {
    const closed = run([key("down"), key("down"), { type: "text", value: "q" }]);
    expect(run([key("down"), { type: "text", value: "q" }], closed)).toBe(closed);
    const reopened = run([key("enter")], closed);
    expect(reopened.open).toBe(true);
    expect(reopened.cursor).toBe(cursorForCurrent(closed.current));
    expect(reopened.outcome).toEqual({ kind: "none" });
  });

  test("other keys and text leave an open menu alone", () => {
    expect(run([key("left"), key("space"), { type: "text", value: "x" }])).toBe(initial);
  });

  test("reset returns the initial state", () => {
    expect(run([key("down"), { type: "reset" }])).toBe(initial);
  });

  test("restart hints match the CLI wording", () => {
    expect(restartHint("claude")).toBe("Restart Claude Code to pick up the new login.");
    expect(restartHint("codex")).toBe("Restart Codex to pick up the new login.");
  });

  test("idle status names the highlighted row and its Enter action", () => {
    expect(statusText(initial)).toBe("work in Claude Code highlighted. Enter to switch.");
  });
});

describe("eventsToPick", () => {
  test("moves to the tapped row then presses Enter", () => {
    const events = eventsToPick(initial, 2);
    expect(events).toEqual([key("down"), key("down"), key("enter")]);
    expect(run(events).current).toBe(profileAt(2).name);
  });

  test("moves up when the row is above the cursor", () => {
    expect(eventsToPick(at(3), 1)).toEqual([key("up"), key("up"), key("enter")]);
  });

  test("returns nothing for a closed menu or an unknown row", () => {
    expect(eventsToPick({ ...initial, open: false }, 1)).toEqual([]);
    expect(eventsToPick(initial, MENU_PROFILES.length)).toEqual([]);
    expect(eventsToPick(initial, -1)).toEqual([]);
  });
});

describe("menu script", () => {
  test("runs in under 15 seconds", () => {
    expect(scriptDuration(menuDefinition.script)).toBeLessThan(15000);
  });

  test("switches a Claude account then a Codex login", () => {
    const afterClaude = foldSteps(menuDefinition, initial, menuDefinition.script.slice(0, 3));
    expect(afterClaude.current).toBe("side");
    expect(afterClaude.outcome.kind).toBe("switched");
    const final = computeFinal(menuDefinition);
    expect(final.current).toBe("side");
    expect(final.currentByTool.codex).toBe("codex-personal");
    expect(final.currentByTool.kimi).toBe(initial.currentByTool.kimi);
    expect(final.outcome).toEqual({ kind: "switched", profileId: profileAt(indexOf("codex", "codex-personal")).id });
    expect(final.open).toBe(true);
  });
});
