"use client";

import { useEffect, useEffectEvent } from "react";

export const useOnMount = (callback: () => void): void => {
  const onMount = useEffectEvent(callback);
  useEffect(() => {
    onMount();
  }, []);
};
