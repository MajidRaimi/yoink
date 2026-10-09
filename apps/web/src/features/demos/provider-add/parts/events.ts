import type { DemoEvent } from "@/shared/contract";

export const ENTER: DemoEvent = { type: "key", key: "enter" };

export const textEvent = (value: string): DemoEvent => ({ type: "text", value });
