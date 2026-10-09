"use client";

import { useEffect, useRef, type RefObject } from "react";

export const useModalDialog = (open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> => {
  const ref = useRef<HTMLDialogElement | null>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    const handleClose = (): void => closeRef.current();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  return ref;
};
