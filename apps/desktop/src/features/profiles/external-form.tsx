import type { FormEvent, ReactElement } from "react";
import type { ExternalProfile } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { useEscapeKey } from "@/shared/ui/dialog";
import { ErrorText } from "@/shared/ui/error-text";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { ViewHeader } from "@/shared/ui/view-header";
import { useExternalProfile } from "@/shared/use-profiles-query";
import { useViewStore } from "@/shared/view-store";
import { useExternalEdit } from "./use-external-edit";

type ExternalEditFormProps = {
  profile: ExternalProfile;
  onDone: (name: string) => void;
  onCancel: () => void;
};

const ExternalEditForm = ({ profile, onDone, onCancel }: ExternalEditFormProps): ReactElement => {
  const edit = useExternalEdit(profile, onDone);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    edit.submit();
  };

  return (
    <form className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3 pb-4" onSubmit={handleSubmit}>
      <Field label="Provider id" hint="renames it in every harness">
        <Input
          autoFocus
          value={edit.draft.name}
          onChange={(event) => edit.setField("name", event.target.value)}
          spellCheck={false}
        />
      </Field>
      <Field label="Display name">
        <Input value={edit.draft.provider} onChange={(event) => edit.setField("provider", event.target.value)} />
      </Field>
      <Field label="API key">
        <Input
          type="password"
          value={edit.draft.token}
          onChange={(event) => edit.setField("token", event.target.value)}
          placeholder="unchanged"
        />
      </Field>
      <ErrorText message={edit.error} />
      <div className="mt-auto flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={edit.saving}>
          Save
        </Button>
      </div>
    </form>
  );
};

export const ExternalForm = (): ReactElement => {
  const editingName = useViewStore((state) => state.editingExternal);
  const setView = useViewStore((state) => state.setView);
  const openHarnesses = useViewStore((state) => state.openHarnesses);
  const returnTo = useViewStore((state) => state.externalReturn);
  const { profile, loading } = useExternalProfile(editingName);
  const leave = (name: string | null): void => {
    if (returnTo === "harnesses" && name !== null) openHarnesses(name);
    else setView("list");
  };
  const back = (): void => leave(editingName);
  useEscapeKey(back);

  return (
    <div className="rise flex min-h-0 flex-1 flex-col">
      <ViewHeader title={editingName === null ? "Edit provider" : `Edit ${editingName}`} onBack={back} />
      {profile === null ? (
        <p className="px-4 py-6 text-center text-[12px] text-muted">
          {loading ? "Loading" : "This provider no longer exists."}
        </p>
      ) : (
        <ExternalEditForm key={profile.name} profile={profile} onDone={leave} onCancel={back} />
      )}
    </div>
  );
};
