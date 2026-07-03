export type CredentialBackend = {
  read: () => Promise<string | null>;
  write: (blob: string) => Promise<void>;
};
