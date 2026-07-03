# Development

This page covers the yoink monorepo: how it is laid out, how to run and build it locally, and how a release moves from a version bump to published npm packages and a GitHub Release.

## Monorepo layout

yoink is a Bun + Turborepo monorepo. There are two apps.

- `apps/cli`: the yoink CLI, compiled to a single macOS binary with `bun build --compile`.
- `apps/web`: the [yoink.codes](https://yoink.codes) site, a Next.js static export deployed to GitHub Pages on push to `main`.

```
.
├── apps/
│   ├── cli/          # the CLI
│   │   └── scripts/
│   │       └── release.ts
│   └── web/          # the yoink.codes Next.js static site
│       └── lib/
│           └── site.ts
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── deploy.yml
└── turbo.json
```

## Getting set up

Install [Bun](https://bun.sh) first, then install dependencies from the repo root.

```bash
bun install
```

Root scripts:

```bash
bun run dev        # mprocs: the web dev server + the CLI test watcher
bun run build      # turbo: build every app
bun run test       # turbo: run tests
bun run typecheck  # turbo: typecheck every app
```

- `dev` runs both apps side by side through mprocs: the `apps/web` dev server and the `apps/cli` test watcher.
- `build`, `test`, and `typecheck` fan out across the workspaces through Turborepo.

## Build the CLI from source

Compile the CLI and link the binary onto your `PATH`.

```bash
cd apps/cli && bun run build
ln -sf "$PWD/dist/yoink" ~/.local/bin/yoink
```

Confirm the link resolves:

```bash
yoink version
```

## Releasing

A release starts from the release script, which takes a full `major.minor.patch` version.

```bash
bun run apps/cli/scripts/release.ts <major.minor.patch>
```

The script:

1. Bumps the version in `apps/cli/package.json` and `apps/web/lib/site.ts`.
2. Commits the change.
3. Tags the commit `vX.Y.Z`.
4. Pushes the commit and tag.

Pushing the tag triggers `.github/workflows/release.yml`, which runs on `macos-latest` and:

1. Verifies the pushed tag matches the CLI `package.json` version.
2. Cross-compiles `darwin-arm64` and `darwin-x64` binaries with `bun build --compile`.
3. Packages each as a `.tar.gz` and writes `checksums.txt` (sha256).
4. Smoke-tests the built binaries.
5. Creates the GitHub Release with the archives and checksums.
6. Publishes three packages to npm with `--provenance`: `yoink-cli`, `yoink-cli-darwin-arm64`, and `yoink-cli-darwin-x64`.

## CI and deploy

Two more workflows run outside the release path.

- `.github/workflows/ci.yml`: runs `typecheck`, `test`, and `build` on every push and pull request.
- `.github/workflows/deploy.yml`: publishes `apps/web/out` to GitHub Pages.

## Distribution architecture

The published npm surface is one main package plus two platform packages.

- `yoink-cli`: the main package, marked `os: darwin`, whose `bin` entry `yoink` points at `bin/yoink.js`, a tiny Node shim.
- `yoink-cli-darwin-arm64` and `yoink-cli-darwin-x64`: optional dependencies, each carrying the raw compiled binary for its architecture.

At runtime the shim resolves the platform package for the current architecture and execs its binary. Declaring the platform packages as `optionalDependencies` means only the matching architecture's binary needs to install.

The other install path is the script:

```bash
curl -fsSL https://yoink.codes/install.sh | bash
```

`install.sh` downloads the architecture-specific `.tar.gz` from the latest GitHub Release, verifies its sha256 against `checksums.txt`, extracts it, and installs the binary to `/usr/local/bin` or `~/.local/bin`.
