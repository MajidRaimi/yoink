# Contributing

Thanks for helping improve yoink. The project is a Bun + Turborepo monorepo: `apps/cli` is the CLI and `apps/web` is the [yoink.codes](https://yoink.codes) site. This guide covers the local setup and the conventions we follow.

## Setup

1. Fork [MajidRaimi/yoink](https://github.com/MajidRaimi/yoink) on GitHub.
2. Clone your fork:

   ```bash
   git clone https://github.com/<your-username>/yoink.git
   cd yoink
   ```

3. Install dependencies with Bun (see [https://bun.sh](https://bun.sh) if you do not have it):

   ```bash
   bun install
   ```

4. Start the dev environment:

   ```bash
   bun run dev
   ```

   This runs mprocs with the `apps/web` dev server and the CLI test watcher.

## Conventions

- Use Bun for all local development. Do not use npm, yarn, or pnpm.
- Do not write comments in source code.
- Do not use em dashes in docs. Use commas, periods, colons, or parentheses instead.
- Keep changes focused. One concern per pull request.
- Match the existing style of the files you touch.

## Tests and checks

Before opening a pull request, make sure these pass from the repo root:

```bash
bun run test
bun run typecheck
bun run build
```

The CLI tests are `bun test` files under `apps/cli/tests`.

## Pull requests

- Branch from `main` using the `type/short-description` naming convention in kebab-case (for example `feat/external-provider-picker`, `fix/keychain-prompt`).
- Write commit messages in conventional-commit format: `type(scope): description` (for example `feat(cli): add model picker search`).
- Open the pull request against `main`.

## Where things live

- `apps/cli/src` holds the CLI source.
- `apps/web` holds the Next.js static-export site for yoink.codes.
- `docs/` holds these guides.

Questions and small fixes are welcome. If you are unsure about scope, open an issue first so we can align before you write code.
