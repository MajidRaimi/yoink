import { ConfirmDialog } from "@/shared/ui/dialog";

type SwitchConfirmProps = {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const SwitchConfirm = ({ name, onConfirm, onCancel }: SwitchConfirmProps) => (
  <ConfirmDialog
    title="Claude Code is running"
    body={`A live session can overwrite the switched credentials on its next refresh. Switching to ${name} may not stick until it exits.`}
    confirmLabel="Switch anyway"
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
);
