import { useEffect, type ReactElement } from "react";
import { Button } from "./button";

const useEscapeListener = (target: Window | Document, onEscape: () => void): void => {
  useEffect(() => {
    const handler = (event: Event) => {
      if (!(event instanceof KeyboardEvent) || event.key !== "Escape") return;
      event.stopPropagation();
      onEscape();
    };
    target.addEventListener("keydown", handler, true);
    return () => target.removeEventListener("keydown", handler, true);
  }, [target, onEscape]);
};

export const useEscapeKey = (onEscape: () => void): void => useEscapeListener(document, onEscape);

const useDialogEscapeKey = (onEscape: () => void): void => useEscapeListener(window, onEscape);

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({ title, body, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps): ReactElement => {
  useDialogEscapeKey(onCancel);
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-glass-strong backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="rise mx-7 w-full rounded-xl border border-hairline-strong bg-glass p-4"
        role="alertdialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-sans text-[14px] font-medium text-foreground">{title}</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} autoFocus onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
