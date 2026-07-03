# yoink

Switch between Claude Code accounts from your terminal, fast.

This is a Bun + Turborepo monorepo.

```
apps/
  cli/    the yoink CLI (macOS, Bun, compiled to a single binary)
  web/    the yoink.codes website (Next.js, fully static export)
packages/ shared packages (reserved)
```

## Develop

```bash
bun install
bun run dev          # mprocs: runs the web dev server and the CLI test watcher
bun run build        # turbo: builds every app
bun run test         # turbo: runs every app's tests
bun run typecheck    # turbo: typechecks every app
```

## CLI

See [apps/cli/README.md](apps/cli/README.md).

```bash
cd apps/cli && bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

## Website

The site at [yoink.codes](https://yoink.codes) is built with Next.js (static export) and deployed to GitHub Pages on every push to `main`.

```bash
cd apps/web && bun run dev
```
