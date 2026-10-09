# Design

The visual system for yoink.codes (`apps/web`, Next.js 16, static export). This page stays in the repo and is not published on the site. Positioning and voice live in [Product](./product.md).

## Theme

Terminal-native and precise: a warm near-black or warm off-white surface, monochrome alpha layering for depth, and one yellow signal shared with the CLI and the menu bar app.

- The theme follows the system (`prefers-color-scheme`) by default. `next-themes` runs with `attribute="class"`, `defaultTheme="system"`, `enableSystem` and `disableTransitionOnChange` in `apps/web/src/shared/ui/theme-provider.tsx`.
- `ThemeToggle` (`shared/ui/theme-toggle.tsx`) flips between light and dark and stores the choice. Dark mode is the `.dark` class on `<html>`, exposed to Tailwind as `@custom-variant dark (&:where(.dark, .dark *))`.
- `html` sets `color-scheme: light`, and `html.dark` sets `color-scheme: dark`, so native controls and scrollbars match.
- The viewport `themeColor` is `#faf9f7` for light and `#0a0908` for dark (`src/app/layout.tsx`).

## Tokens

All tokens live in `packages/tokens/tokens.css`, shared with the desktop app. Additions are additive only, so the desktop app keeps working. `apps/web/src/app/globals.css` imports the file and maps each token into Tailwind v4 with `@theme inline`. Use the Tailwind utility, never a raw hex or a raw `var()` in a class.

### Color

| Token | Light | Dark | Tailwind |
| --- | --- | --- | --- |
| `--background` | `#faf9f7` | `#0a0908` | `bg-background` |
| `--foreground` | `#131110` | `#f5f4f2` | `text-foreground` |
| `--muted` | ink 68% | paper 68% | `text-muted` |
| `--faint` | ink 62% | paper 50% | `text-faint` |
| `--surface` | ink 3% | white 3% | `bg-surface` |
| `--surface-2` | ink 6% | white 8% | `bg-surface-2` |
| `--surface-3` | ink 10% | white 14% | `bg-surface-3` |
| `--hairline` | ink 8% | white 6% | `border-hairline` |
| `--hairline-strong` | ink 14% | white 10% | `border-hairline-strong` |
| `--brand` | `#facc15` | `#facc15` | `bg-brand` |
| `--brand-soft` | `#fde68a` | `#fde68a` | `bg-brand-soft` |
| `--brand-text` | `#a16207` | `#facc15` | `text-brand-text` |
| `--on-brand` | `#0a0908` | `#0a0908` | `text-on-brand` |
| `--ring` | `#a16207` | `#facc15` | `outline-ring` |
| `--success` | `#15803d` | `#4ade80` | `text-success` |
| `--danger` | `#b91c1c` | `#f87171` | `text-danger` |

Color rules:

- A yellow fill always carries `text-on-brand`. Never put yellow text on a light surface; accent text uses `text-brand-text`, which passes AA in both themes.
- Depth comes from the surface and hairline steps, never from extra gray hexes.
- `--success` and `--danger` appear only for real state: an active account, a written file, a failed step, a warning.
- The final CTA band (`features/landing/sections/final-cta.module.css`) rescopes the color tokens so everything inside reads ink on yellow. Reuse that pattern instead of hand-picking colors for a yellow surface.

### Corners

| Token | Value | Tailwind |
| --- | --- | --- |
| `--corner-xs` | `4px` | `rounded-xs` |
| `--corner-sm` | `6px` | `rounded-sm` |
| `--corner-md` | `10px` | `rounded-md` |
| `--corner-lg` | `14px` | `rounded-lg` |
| `--corner-xl` | `20px` | `rounded-xl` |
| `--corner-pill` | `999px` | `rounded-pill` |
| `--corner-button` | `var(--corner-pill)` | `rounded-button` |
| `--corner-inset` | `4px` | `rounded-inset` |

Radius rule: radius grows with the size of the element and nests concentrically (inner radius equals outer radius minus the padding between them).

- `rounded-xs`: keycaps, inline code, focusable text links.
- `rounded-sm`: icon buttons and small controls inside a frame.
- `rounded-md`: command lines and inputs.
- `rounded-lg`: demo frames and cards.
- `rounded-xl`: the largest panels only.
- `rounded-button`: every `ButtonLink`, plus the theme toggle.
- `rounded-pill`: segmented controls and tags.

Never round past `rounded-xl` on a container, and never mix radii on the same level of a layout.

### Elevation

| Token | Tailwind | Use |
| --- | --- | --- |
| `--elevation-1` | `shadow-1` | Keycaps, small raised controls |
| `--elevation-2` | `shadow-2` | Demo frames |
| `--elevation-3` | `shadow-3` | Overlays such as the search dialog |

In dark mode each elevation adds a 1px white hairline ring, since shadows alone do not read on near-black.

### Type scale

| Token | Value | Tailwind | Line height |
| --- | --- | --- | --- |
| `--type-xs` | `0.75rem` | `text-xs` | `--line-normal` |
| `--type-sm` | `0.875rem` | `text-sm` | `--line-normal` |
| `--type-base` | `1rem` | `text-base` | `--line-relaxed` |
| `--type-lg` | `1.125rem` | `text-lg` | `--line-relaxed` |
| `--type-xl` | `1.3125rem` | `text-xl` | `--line-snug` |
| `--type-2xl` | `1.625rem` | `text-2xl` | `--line-snug` |
| `--type-3xl` | `clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem)` | `text-3xl` | `--line-snug` |
| `--type-4xl` | `clamp(2.125rem, 1.6rem + 2.4vw, 3.25rem)` | `text-4xl` | `--line-tight` |
| `--type-5xl` | `clamp(2.5rem, 1.7rem + 3.8vw, 4.5rem)` | `text-5xl` | `--line-tight` |

Line heights: `--line-tight` (1.05), `--line-snug` (1.2), `--line-normal` (1.5), `--line-relaxed` (1.65), mapped to `leading-tight`, `leading-snug`, `leading-normal` and `leading-relaxed`.

Letter spacing: `--letter-display` (-0.025em), `--letter-tight` (-0.012em), `--letter-normal` (0), `--letter-mono` (-0.01em), `--letter-caps` (0.08em), mapped to `tracking-display`, `tracking-tight`, `tracking-normal`, `tracking-mono` and `tracking-caps`.

### Motion tokens

| Token | Value | Tailwind |
| --- | --- | --- |
| `--motion-ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-out` |
| `--motion-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | `ease-in-out` |
| `--dur-1` | `120ms` | `dur-1` |
| `--dur-2` | `220ms` | `dur-2` |
| `--dur-3` | `420ms` | `dur-3` |

`dur-1`, `dur-2` and `dur-3` are custom `@utility` rules in `globals.css` that set `transition-duration`. Under `prefers-reduced-motion: reduce` the tokens file sets all three durations to `0ms`.

### Focus ring

`--ring` and `--ring-width` (`2px`) drive both the global `:focus-visible` outline and the `focus-ring` utility (`outline: var(--ring-width) solid var(--ring); outline-offset: 2px`). Every interactive element uses `focus-visible:focus-ring`. Never remove an outline without replacing it.

### Scrollbar

Thin, transparent track, 6px thumb in `--brand` at 40% (65% on hover), declared for both WebKit and Firefox in `globals.css`. Never reserve a gutter.

## Typography

Both families load through `next/font/google` in `apps/web/src/shared/brand/fonts.ts`, self-hosted at build time.

- **Archivo** (`--font-archivo`, loaded with the `wdth` axis) is the sans and display face, mapped to `font-sans`.
- **JetBrains Mono** (`--font-jetbrains-mono`) is mapped to `font-mono` for commands, paths, keys, keycaps, demo frames, eyebrows and figures.

Headings use the `display` utility: `font-stretch: 112%`, weight 620, `tracking-display`, `leading-tight` and `text-wrap: balance`. Body text is `text-base` at `leading-relaxed`; keep prose under about 70 characters per line.

## Icons

Phosphor only (`@phosphor-icons/react`), always through the shared `Icon` wrapper in `shared/ui/icon.tsx`, which sets `aria-hidden` unless a `label` is passed. Server Components import from `@phosphor-icons/react/ssr`. Brand marks for harnesses and providers come from `simple-icons` or `apps/web/public/logos` through `BrandLogoGlyph`; a brand with no real logo is left out rather than drawn. No hand-drawn SVG icons, no emoji, no lucide.

## Components

Shared primitives live in `apps/web/src/shared/ui`. Feature-specific pieces live in their feature folder.

| Component | File | Notes |
| --- | --- | --- |
| `ButtonLink`, `buttonStyles` | `button.tsx` | Variants `primary` (yellow fill), `secondary` (surface-2 with strong hairline), `ghost`. Sizes `sm`, `md`, `lg`. `ButtonLink` picks `next/link` or `<a>` from the href. |
| `TextLink`, `textLinkStyles` | `link.tsx` | Tones `accent` (yellow underline) and `muted`. |
| `Container` | `container.tsx` | Sizes `wide` (`max-w-7xl`, the default and the one page width shared by navbar, sections and footer) and `prose` (`max-w-3xl`, inner reading width only), gutter `px-4 sm:px-6`. |
| `CopyCommand` | `copy-command.tsx` | A mono command line with a yellow prompt, a copy button and a polite live region. |
| `InlineCode` | `code.tsx` | Inline mono code on `bg-surface-2`. |
| `Kbd` | `kbd.tsx` | Mono keycap with `shadow-1`. |
| `Icon` | `icon.tsx` | Phosphor wrapper. |
| `BrandLogoGlyph` | `brand-logo.tsx` | Harness and provider logos as SVG paths or masks. |
| `Logo`, `YoinkMark` | `logo.tsx` | The mark on a yellow tile plus the wordmark. |
| `Navbar`, `NavbarMenu`, `NavLinkItem`, `navLinks` | `navbar.tsx`, `navbar-menu.tsx`, `nav-link-item.tsx`, `nav-links.ts` | Sticky top bar on `bg-background` with a bottom hairline and a skip link; collapses to a disclosure menu below `md`. |
| `Footer` | `footer.tsx` | Brand column plus three link columns from `sm` up. |
| `ThemeProvider`, `ThemeToggle` | `theme-provider.tsx`, `theme-toggle.tsx` | See Theme. |
| `Href`, `isExternalHref` | `href.ts` | Typed internal routes and external URLs. |

The props of the shared primitives and every cross-feature type (`DemoId`, `DemoEvent`, `Step`, `DemoSlotProps`, `DocMeta`, `Platform`, `ReleaseInfo`, `CtaLabel`) live in `apps/web/src/shared/contract.ts`. Route helpers live in `shared/lib/routes.ts`.

Not allowed anywhere: gradient text, `backdrop-blur` or other glass, colored side stripes on cards, cards nested in cards, pastel icon tiles, numbered section markers.

## Motion

Motion shows real state changes only: a switch, a sync, a file write, the active row moving. Nothing ambient, nothing that loops except the single logo marquee.

- Transitions use the `dur-*` utilities with `ease-out`. Hover and press feedback is `dur-1`; panel and row changes are `dur-2`; the longest is `dur-3`.
- Section reveals use `Reveal` (`features/landing/components/reveal.tsx`), a CSS scroll-driven animation (`animation-timeline: view()`) that only runs under `prefers-reduced-motion: no-preference` and when the browser supports it. Content is fully visible without it.
- The logo wall is the only marquee on the page. It pauses on hover and through its control, and becomes a static wrapped row under reduced motion.
- `motion/react` is used only where it earns its weight. Today that is `useInView` and `useReducedMotion` inside the demo engine.
- Never attach `window` scroll listeners. Use `IntersectionObserver`, `useInView` or CSS scroll timelines.
- No three.js, no canvas backgrounds, no GSAP.

### Reduced motion

- The tokens file zeroes `--dur-1`, `--dur-2` and `--dur-3`.
- `globals.css` clamps every animation and transition to `0.01ms`, runs animations once, and turns off smooth scrolling.
- Demos skip autoplay and settle straight on their final frame, still fully interactive.
- The marquee becomes a static row and `Reveal` does nothing.

## Demo engine

Demos live in `apps/web/src/features/demos`. Each is a pure state machine played by a shared engine.

- **Data.** `bun run --cwd apps/web gen:data` runs `scripts/gen-data.ts`, which imports the real CLI constants and writes `features/demos/data/*.gen.ts` (`harnesses`, `presets`, `subscriptions`, `groups`) with `as const`. Never edit a `.gen.ts` file by hand. CI fails if regenerating changes them.
- **Folder shape.** Each demo folder (`menu`, `provider-add`, `subscription-switch`, `menubar-panel`) holds:
  - `machine.ts`: the `initial` state and a pure `reduce(state, event)`, with `machine.test.ts` beside it (`bun test`);
  - `script.ts`: the autoplay `Step[]`, each step a `wait` in milliseconds plus a `DemoEvent`;
  - `definition.ts`: a `DemoDefinition` tying `id`, `label`, `initial`, `reduce` and `script` together;
  - `view.tsx`: the presentational view, shared by both renders;
  - `static.tsx`: the final frame, computed on the server with `computeFinal`;
  - `island.tsx`: the client entry that drives the view through `useDemo`.
- **Engine.** `engine/player.ts` is the playback reducer (`idle`, `auto`, `done`, `user`). `engine/frames.ts` folds scripts (`computeFinal`, `computeFrames`). `engine/keymap.ts` maps keys to `DemoEvent` (arrows, `j` and `k`, Enter, Space, Esc, Backspace, printable text in text mode). `engine/use-demo.ts` is the hook every island uses. `engine/demo-frame.tsx` is the shared chrome: title bar, Replay button, live status line and keyboard hints.
- **Playback.** Autoplay starts when the demo is at least 35% in view and stops at the first key, pointer or focus. Replay restarts the script, or settles on the final frame under reduced motion. Autoplay pauses while the demo is out of view.
- **First paint.** The server renders the final frame. `DemoSlot` (`features/demos/demo-slot.tsx`) loads each island with `next/dynamic`, using the static frame as its loading state. The hero menu demo loads eagerly with `eager`.
- **Keyboard and touch.** Keys are handled on the demo element only, never on `window`. The frame is a `role="group"` with `aria-roledescription="interactive demo"`, and keyboard focus lands on the frame or on its list (`DemoFrame` `focusTarget`). Lists are `role="listbox"` with `aria-activedescendant`. Every row is also clickable for touch. The status line is an `aria-live="polite"` region that announces each result.
- **Truth.** A demo only shows what the product does. The menu bar demo shows real app features only and never switches a non-Claude subscription.
- **Docs.** A doc's frontmatter `demo` field places that live demo above the article.

## Layout

Containers come from `Container`. Landing sections use `py-24 md:py-32` (the logo wall, proof and install use tighter rhythm) and alternate plain background with `bg-surface` bands separated by hairlines. Each section uses a different layout family:

| Section | File | Layout family |
| --- | --- | --- |
| Hero | `sections/hero.tsx` | Asymmetric 12-column split: text on 5 columns, the live `menu` demo on 7. At most four text elements. |
| Logo wall | `sections/logo-wall.tsx` | Single full-width marquee of harness and provider logos. |
| Act 1: switch | `sections/act-switch.tsx` | Centered stage: eyebrow and header above the `subscription-switch` demo at `max-w-3xl`. |
| Act 2: providers | `sections/act-providers.tsx` | Two-pane: the `provider-add` demo on 7 columns beside a four-step ledger. |
| Act 3: surfaces | `sections/act-surfaces.tsx` | Segmented Terminal or Menu bar toggle over one shared frame. |
| Proof | `sections/proof.tsx` | One editorial sentence at `prose` width with build-time figures in mono. |
| Safety | `sections/safety.tsx` | Eyebrow and header, then a ledger of managed keys beside an animated `settings.json` diff. |
| Install | `sections/install.tsx` | `#install` anchor with OS tabs (macOS, Linux, Windows, npm), visitor's OS preselected. |
| Final CTA | `sections/final-cta.tsx` | Full-bleed yellow band with the OS-aware primary CTA. |

Eyebrows appear on Act 1 and Safety only. The docs use a pinned sidebar grouped Start, Switch, Connect, Understand and Reference, a content column, a per-page table of contents, and a prev and next pager.

Layout must work at 375px with a 16px gutter and no horizontal page scroll. Wide content (code, tables, demo frames) scrolls inside itself.

## Accessibility

- WCAG 2.1 AA in light and dark: body text at least 4.5:1, large text at least 3:1. Accent text uses `text-brand-text`.
- Visible `:focus-visible` ring on every interactive element, a skip link to `#main`, semantic landmarks, one `h1` per page and an ordered heading outline.
- Full keyboard navigation, including every demo, the search dialog (Command K, Control K or `/`), tabs and segmented controls.
- Values whose direction may differ from the page (paths, commands, versions, counts, fetched figures) sit in `<bdi>`.
- Reduced motion is honored everywhere, as described above.
- Targets: axe reports zero violations on every route in both themes, and Lighthouse accessibility is at least 95.

## Quality gates

Run from the repo root. All must pass before a site change ships.

```sh
bun run --cwd apps/web gen:data && git diff --exit-code apps/web/src
bun run --cwd apps/web typecheck
bun test apps/web/src apps/web/scripts
bun run --cwd apps/web build
bun run --cwd apps/web check:links
bun run --cwd apps/web check:slop
bunx lhci autorun --config=apps/web/lighthouserc.json
bunx playwright test -c apps/web/playwright.config.ts
```

- `check:links` checks every href, src and anchor in `apps/web/out`, plus the install scripts, CNAME, sitemap, robots, manifest, OG images and alias pages.
- `check:slop` fails on code comments, `any` in type positions, em and en dashes, lucide or three imports, `window` scroll listeners, gradient text, `backdrop-blur`, emoji and the banned phrases listed in [Product](./product.md). It scans `apps/web` source, `packages/tokens/tokens.css`, `README.md` and `docs/*.md`.
- Lighthouse runs mobile against every route: performance at least 90, accessibility at least 95, SEO at least 95, best practices at least 90, CLS at most 0.05.
- Playwright runs every route in light, dark and reduced motion, with axe, the CTA checks and keyboard tests on each demo.
