import { describe, expect, test } from "bun:test";
import type { DemoEvent, DemoKey } from "@/shared/contract";
import { computeFinal, foldSteps, scriptDuration } from "@/features/demos/engine/frames";
import { FUSE_PROVIDER, PROVIDER_PROFILES } from "@/features/demos/data/fixtures";
import { HARNESSES } from "@/features/demos/data/harnesses.gen";
import { menubarPanelDemo } from "@/features/demos/menubar-panel/definition";
import {
  HARNESS_PICKER_HEIGHT,
  HARNESS_ROW_HEIGHT,
  HARNESS_VIEWPORT_HEIGHT,
  connectionsFor,
  eventsForDialog,
  eventsToCycleDefault,
  eventsToFocusHarness,
  eventsToOpenProfile,
  eventsToToggleHarness,
  harnessRows,
  initialPanelState,
  isTextMode,
  linksFor,
  providerProfile,
  reducePanel,
  selectedProfileIndex,
  showsDefaultModel,
  visibleHarnessCount,
  visibleProfiles,
  type PanelState,
} from "@/features/demos/menubar-panel/machine";
import { PANEL_PROFILES } from "@/features/demos/menubar-panel/panel-data";

const key = (name: DemoKey): DemoEvent => ({ type: "key", key: name });

const run = (events: readonly DemoEvent[], from: PanelState = initialPanelState): PanelState =>
  events.reduce(reducePanel, from);

const indexOfProfile = (name: string): number => PANEL_PROFILES.findIndex((profile) => profile.name === name);

const indexOfHarness = (id: string): number => HARNESSES.findIndex((harness) => harness.id === id);

const openProvider = (name: string, from: PanelState = initialPanelState): PanelState =>
  run(eventsToOpenProfile(from, indexOfProfile(name)), from);

const focusHarness = (state: PanelState, id: string): PanelState =>
  run(eventsToFocusHarness(state, indexOfHarness(id)), state);

const fuse = (state: PanelState): readonly string[] => connectionsFor(state, FUSE_PROVIDER.name);

const selectedRowFits = (state: PanelState): boolean => {
  const provider = providerProfile(state.provider);
  if (provider === null) return false;
  const heights = harnessRows(state, provider).map(
    (row) => HARNESS_ROW_HEIGHT + (showsDefaultModel(row, provider) ? HARNESS_PICKER_HEIGHT : 0),
  );
  const span = heights.slice(state.harnessOffset, state.harnessIndex + 1).reduce((total, height) => total + height, 0);
  return state.harnessOffset <= state.harnessIndex && span <= HARNESS_VIEWPORT_HEIGHT;
};

describe("menubar panel profile list", () => {
  test("lists Claude accounts then providers from the fixtures", () => {
    expect(visibleProfiles(initialPanelState).map((profile) => profile.name)).toEqual(PANEL_PROFILES.map((p) => p.name));
    expect(PANEL_PROFILES.filter((profile) => profile.type === "external")).toHaveLength(PROVIDER_PROFILES.length);
  });

  test("up and down move the selection and clamp at the edges", () => {
    expect(selectedProfileIndex(run([key("up")]))).toBe(0);
    expect(selectedProfileIndex(run([key("down"), key("down")]))).toBe(2);
    const bottom = run(Array.from({ length: 20 }, () => key("down")));
    expect(selectedProfileIndex(bottom)).toBe(PANEL_PROFILES.length - 1);
    expect(selectedProfileIndex(run([key("down"), key("up")]))).toBe(0);
  });

  test("typing filters by name, email or provider and resets the selection", () => {
    const typed = run([key("down"), { type: "text", value: "f" }, { type: "text", value: "u" }]);
    expect(typed.query).toBe("fu");
    expect(typed.listIndex).toBe(0);
    expect(visibleProfiles(typed).map((profile) => profile.name)).toEqual(["fuse"]);
    const byEmail = run([{ type: "text", value: "quietharbor" }]);
    expect(visibleProfiles(byEmail).map((profile) => profile.name)).toEqual(["side"]);
    const byProvider = run([{ type: "text", value: "OpenRouter" }]);
    expect(visibleProfiles(byProvider).map((profile) => profile.name)).toEqual(["openrouter"]);
  });

  test("backspace trims the query and escape clears it", () => {
    const typed = run([{ type: "text", value: "zz" }]);
    expect(visibleProfiles(typed)).toHaveLength(0);
    expect(selectedProfileIndex(typed)).toBe(-1);
    expect(run([key("enter")], typed)).toEqual({ ...typed, status: 'No profiles match "zz".' });
    expect(run([key("backspace")], typed).query).toBe("z");
    expect(run([key("escape")], typed).query).toBe("");
    expect(run([key("escape")])).toEqual(initialPanelState);
  });

  test("moving announces the selected profile", () => {
    expect(run([key("down")]).status).toBe("personal, sara@haddad.example");
    expect(run([key("down"), key("up")]).status).toBe("work, sara.haddad@lumenlabs.example, active");
    expect(run([key("down"), key("down"), key("down")]).status).toBe("fuse, Fuse");
  });

  test("keys without a list binding leave the state alone", () => {
    expect(run([key("left"), key("right"), key("space"), key("tab")])).toEqual(initialPanelState);
  });

  test("enter on the active account changes nothing but the status", () => {
    const state = run([key("enter")]);
    expect(state.current).toBe(initialPanelState.current);
    expect(state.dialog).toBeNull();
    expect(state.status).toContain("already active");
  });

  test("text mode is on only in the list without a dialog", () => {
    expect(isTextMode(initialPanelState)).toBe(true);
    expect(isTextMode(run([key("down"), key("enter")]))).toBe(false);
    expect(isTextMode(openProvider("fuse"))).toBe(false);
  });
});

describe("menubar panel switch confirm", () => {
  const confirming = run([key("down"), key("enter")]);

  test("selecting another account while Claude Code runs opens the confirm", () => {
    expect(confirming.dialog).toEqual({ kind: "switch", name: "personal" });
    expect(confirming.dialogFocus).toBe("confirm");
    expect(confirming.current).toBe("work");
  });

  test("enter on Switch anyway switches the account", () => {
    const switched = run([key("enter")], confirming);
    expect(switched.current).toBe("personal");
    expect(switched.dialog).toBeNull();
    expect(switched.status).toBe("Switched Claude Code to personal");
  });

  test("escape and Cancel close the confirm without switching", () => {
    expect(run([key("escape")], confirming)).toMatchObject({ dialog: null, current: "work" });
    expect(run([key("left"), key("enter")], confirming)).toMatchObject({ dialog: null, current: "work" });
    expect(run([key("left"), key("space")], confirming)).toMatchObject({ dialog: null, current: "work" });
  });

  test("left, right and tab move focus between the dialog buttons", () => {
    expect(run([key("left")], confirming).dialogFocus).toBe("cancel");
    expect(run([key("left"), key("right")], confirming).dialogFocus).toBe("confirm");
    expect(run([key("tab")], confirming).dialogFocus).toBe("cancel");
    expect(run([key("tab"), key("tab")], confirming).dialogFocus).toBe("confirm");
  });

  test("other input is ignored while the dialog is open", () => {
    expect(run([key("down"), { type: "text", value: "a" }, key("backspace")], confirming)).toEqual(confirming);
  });

  test("dialog click helpers map to the same transitions", () => {
    expect(run(eventsForDialog("confirm"), run([key("left")], confirming)).current).toBe("personal");
    expect(run(eventsForDialog("cancel"), confirming).current).toBe("work");
  });

  test("with Claude Code stopped the switch happens without a confirm", () => {
    const stopped = { ...initialPanelState, claudeRunning: false };
    const switched = run([key("down"), key("enter")], stopped);
    expect(switched.dialog).toBeNull();
    expect(switched.current).toBe("personal");
  });
});

describe("menubar panel harness checklist", () => {
  const opened = openProvider("fuse");
  const provider = providerProfile("fuse");

  test("enter on a provider opens its checklist", () => {
    expect(opened.view).toBe("harnesses");
    expect(opened.provider).toBe("fuse");
    expect(opened.harnessIndex).toBe(0);
    expect(opened.status).toBe("Opened fuse: 2 harnesses connected");
    expect(openProvider("openrouter").status).toBe("Opened openrouter: 1 harness connected");
    expect(providerProfile("work")).toBeNull();
  });

  test("moving announces the selected harness", () => {
    expect(run([key("down")], opened).status).toBe("pi, connected");
    expect(focusHarness(opened, "opencode").status).toBe("opencode, not connected");
  });

  test("rows follow the generated harness list with real compatibility", () => {
    if (provider === null) throw new Error("fuse fixture missing");
    const rows = harnessRows(opened, provider);
    expect(rows.map((row) => row.id)).toEqual(HARNESSES.map((harness) => harness.id));
    const claudeCode = rows.find((row) => row.id === "claude-code");
    expect(claudeCode).toMatchObject({ compatible: false, selectable: false, stateLabel: "incompatible" });
    expect(claudeCode?.detail).toBe("Needs Anthropic Messages");
    expect(rows.find((row) => row.id === "goose")).toMatchObject({ installed: false, stateLabel: "not installed" });
    expect(rows.find((row) => row.id === "pi")).toMatchObject({ connected: true, stateLabel: "connected" });
    expect(rows.find((row) => row.id === "droid")?.setsDefaultModel).toBe(false);
  });

  test("navigation clamps and keeps the active row inside the window by height", () => {
    expect(run([key("up")], opened).harnessIndex).toBe(0);
    const walk = Array.from({ length: HARNESSES.length }, (_, step) => step);
    walk.reduce((state) => {
      const next = run([key("down")], state);
      expect(selectedRowFits(next)).toBe(true);
      return next;
    }, opened);
    const bottom = run(Array.from({ length: 30 }, () => key("down")), opened);
    expect(bottom.harnessIndex).toBe(HARNESSES.length - 1);
    expect(bottom.harnessOffset).toBeGreaterThan(0);
    const back = run(Array.from({ length: 30 }, () => key("up")), bottom);
    expect(back).toMatchObject({ harnessIndex: 0, harnessOffset: 0 });
  });

  test("rows that grow a default picker keep the selection in view", () => {
    const grown = ["omp", "opencode", "qwen"].reduce(
      (state, id) => run([key("space")], focusHarness(state, id)),
      opened,
    );
    expect(fuse(grown)).toEqual(["pi", "omp", "opencode", "qwen", "crush"]);
    expect(selectedRowFits(grown)).toBe(true);
    Array.from({ length: HARNESSES.length }).reduce<PanelState>((state) => {
      const next = run([key("down")], state);
      expect(selectedRowFits(next)).toBe(true);
      return next;
    }, run(Array.from({ length: 30 }, () => key("up")), grown));
    if (provider === null) throw new Error("fuse fixture missing");
    expect(visibleHarnessCount(grown, provider)).toBeGreaterThan(0);
  });

  test("space and enter toggle a compatible harness on and off", () => {
    const onOpencode = focusHarness(opened, "opencode");
    const connected = run([key("space")], onOpencode);
    expect(fuse(connected)).toEqual(["pi", "opencode", "crush"]);
    expect(connected.status).toBe("Connected fuse to opencode");
    const disconnected = run([key("enter")], connected);
    expect(fuse(disconnected)).toEqual(["pi", "crush"]);
    expect(disconnected.status).toBe("Disconnected fuse from opencode");
  });

  test("disconnecting drops the saved default model", () => {
    const disconnected = run([key("space")], focusHarness(opened, "pi"));
    expect(fuse(disconnected)).toEqual(["crush"]);
    expect(linksFor(disconnected, "fuse").defaults.pi).toBeUndefined();
  });

  test("incompatible and missing harnesses do not toggle", () => {
    const blocked = run([key("space")], opened);
    expect(fuse(blocked)).toEqual(fuse(opened));
    expect(blocked.status).toBe("Claude Code: incompatible");
    const missing = run([key("space")], focusHarness(opened, "goose"));
    expect(fuse(missing)).toEqual(fuse(opened));
  });

  test("left and right cycle the default model of a connected harness", () => {
    const models = FUSE_PROVIDER.models;
    const onCrush = focusHarness(opened, "crush");
    expect(linksFor(run([key("right")], onCrush), "fuse").defaults.crush).toBe(models[0]);
    expect(linksFor(run([key("left")], onCrush), "fuse").defaults.crush).toBe(models[models.length - 1]);
    const onPi = focusHarness(opened, "pi");
    expect(linksFor(run([key("right")], onPi), "fuse").defaults.pi).toBe(models[1]);
    expect(linksFor(run([key("left")], onPi), "fuse").defaults.pi).toBe(models[models.length - 1]);
    const onOmp = focusHarness(opened, "omp");
    expect(run([key("right")], onOmp)).toEqual(onOmp);
  });

  test("text and unbound keys are ignored in the checklist", () => {
    expect(run([{ type: "text", value: "x" }, key("backspace"), key("tab")], opened)).toEqual(opened);
  });

  test("escape returns to a fresh list", () => {
    const back = run([key("escape")], opened);
    expect(back).toMatchObject({ view: "list", query: "", listIndex: 0 });
  });

  test("connecting Claude Code while it runs asks first and makes the provider active", () => {
    const openrouter = openProvider("openrouter");
    const asking = run([key("enter")], openrouter);
    expect(asking.dialog).toEqual({ kind: "connect", provider: "openrouter", harness: "claude-code" });
    expect(run([key("escape")], asking)).toMatchObject({ current: "work", links: openrouter.links });
    const connected = run([key("enter")], asking);
    expect(connected.dialog).toBeNull();
    expect(connected.current).toBe("openrouter");
    expect(connected.lastClaudeAccount).toBe("work");
    expect(connectionsFor(connected, "openrouter")).toEqual(["claude-code", "droid"]);
    const stopped = run([key("enter")], { ...openrouter, claudeRunning: false });
    expect(stopped.dialog).toBeNull();
    expect(stopped.current).toBe("openrouter");
  });

  test("disconnecting Claude Code restores the last Claude account", () => {
    const connected = run([key("enter")], openProvider("openrouter", { ...initialPanelState, claudeRunning: false }));
    const withModel = run([key("right")], connected);
    expect(linksFor(withModel, "openrouter").defaults["claude-code"]).toBeDefined();
    const released = run([key("space")], withModel);
    expect(released.current).toBe("work");
    expect(connectionsFor(released, "openrouter")).toEqual(["droid"]);
    expect(linksFor(released, "openrouter").defaults["claude-code"]).toBeUndefined();
  });

  test("switching accounts disconnects the provider from Claude Code", () => {
    const stopped = { ...initialPanelState, claudeRunning: false };
    const connected = run([key("enter")], openProvider("openrouter", stopped));
    const back = run([key("escape")], connected);
    const switched = run([key("down"), key("enter")], back);
    expect(switched).toMatchObject({ current: "personal", lastClaudeAccount: "personal" });
    expect(connectionsFor(switched, "openrouter")).toEqual(["droid"]);
  });

  test("click helpers reach the same rows as the keyboard", () => {
    const index = indexOfHarness("opencode");
    expect(fuse(run(eventsToToggleHarness(opened, index), opened))).toContain("opencode");
    const later = run([key("down"), key("down"), key("down"), key("down"), key("down")], opened);
    expect(run(eventsToFocusHarness(later, 1), later).harnessIndex).toBe(1);
    const crush = indexOfHarness("crush");
    expect(linksFor(run(eventsToCycleDefault(opened, crush), opened), "fuse").defaults.crush).toBe(FUSE_PROVIDER.models[0]);
  });

  test("a missing provider leaves the checklist inert", () => {
    const orphan = { ...opened, provider: "gone" };
    expect(run([key("space"), key("right")], orphan)).toEqual(orphan);
    expect(linksFor(orphan, "gone")).toEqual({ connections: [], defaults: {} });
  });
});

describe("menubar panel definition and script", () => {
  test("reset returns to the initial state", () => {
    expect(reducePanel(openProvider("fuse"), { type: "reset" })).toEqual(initialPanelState);
  });

  test("script switches via the confirm, connects opencode and returns to the list", () => {
    const final = computeFinal(menubarPanelDemo);
    expect(final.view).toBe("list");
    expect(final.current).toBe("personal");
    expect(final.dialog).toBeNull();
    expect(fuse(final)).toEqual(["pi", "opencode", "crush"]);
  });

  test("script passes through the confirm and the opencode row", () => {
    const steps = menubarPanelDemo.script;
    expect(foldSteps(menubarPanelDemo, initialPanelState, steps.slice(0, 2)).dialog).toEqual({
      kind: "switch",
      name: "personal",
    });
    const beforeToggle = foldSteps(menubarPanelDemo, initialPanelState, steps.slice(0, 9));
    expect(beforeToggle).toMatchObject({ view: "harnesses", provider: "fuse", harnessIndex: indexOfHarness("opencode") });
  });

  test("script tells the story in under 15 seconds", () => {
    expect(scriptDuration(menubarPanelDemo.script)).toBeLessThan(15000);
    expect(menubarPanelDemo.id).toBe("menubar-panel");
  });
});
