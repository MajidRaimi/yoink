"use client";

import { useEffect, useRef } from "react";
import type { DemoController } from "@/features/demos/engine/use-demo";
import { useLinkedAccountStore } from "@/features/demos/linked/store";
import type { AccountAdapter } from "@/features/demos/linked/types";

export const useLinkedAccount = <State,>(
  demo: DemoController<State>,
  adapter: AccountAdapter<State>,
  linked: boolean,
): void => {
  const shared = useLinkedAccountStore((store) => store.account);
  const publish = useLinkedAccountStore((store) => store.publish);
  const account = adapter.read(demo.state);
  const { mode, patch } = demo;
  const lastAccount = useRef(account);
  const lastShared = useRef<string | null>(null);

  useEffect(() => {
    if (!linked || lastAccount.current === account) return;
    lastAccount.current = account;
    if (mode === "user" && account !== null && account !== shared) publish(account);
  }, [linked, account, mode, shared, publish]);

  useEffect(() => {
    if (!linked || lastShared.current === shared) return;
    lastShared.current = shared;
    if (shared !== null) patch((state) => adapter.write(state, shared));
  }, [linked, shared, patch, adapter]);
};
