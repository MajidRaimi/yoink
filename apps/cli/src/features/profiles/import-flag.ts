import { loadStore, saveStore } from "./store";

export const wasImportOffered = async (): Promise<boolean> => (await loadStore()).importOffered === true;

export const markImportOffered = async (): Promise<void> => {
  const store = await loadStore();
  if (store.importOffered === true) return;
  store.importOffered = true;
  await saveStore(store);
};
