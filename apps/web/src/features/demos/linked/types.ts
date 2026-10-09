export type AccountAdapter<State> = {
  read: (state: State) => string | null;
  write: (state: State, account: string) => State;
};

export type DemoIslandProps = {
  linked?: boolean;
};
