# Design

Visual system for yoink.codes (`apps/web`, Next.js static). Tokens live in `apps/web/app/globals.css` (Tailwind v4 `@theme inline` + `:root` / `.dark` variables). Dark is the default theme; light is the toggled variant.

## Theme

Terminal-native dark. Near-black warm surface, monochrome alpha layering for depth (never gray hexes), one yellow accent shared with the CLI's picocolors theme. The RunPod surface recipe (white-alpha fills 3/8/14%, hairlines 6/10%, generous radii, ambient glows) transposed from violet to yellow.

## Color

| Token | Dark (default) | Light |
| --- | --- | --- |
| `--background` | `#0a0908` | `#faf9f7` |
| `--foreground` | `#f5f4f2` | `#131110` |
| `--muted` (secondary text) | fg 68% | ink 68% |
| `--faint` (tertiary text) | fg 40% | ink 42% |
| `--surface` / `-2` / `-3` | white 3% / 8% / 14% | ink 3% / 6% / 10% |
| `--hairline` / `-strong` | white 6% / 10% | ink 8% / 14% |
| `--brand` | `#facc15` | `#facc15` |
| `--brand-soft` | `#fde68a` | `#fde68a` |
| `--brand-text` (accent text) | `#facc15` | `#a16207` |
| `--on-brand` (text on yellow) | `#0a0908` | `#0a0908` |

Rules: yellow fills always carry near-black text. Accent-colored text uses `--brand-text` (AA in both themes). Ambient glows: radial `rgba(250,204,21,.10-.14)`, dark theme only, behind hero and featured cards. Terminal greens/reds appear only inside rendered terminal UI (matching the CLI: green = active account, yellow = brand/hotkeys).

## Typography

- **Display**: Space Grotesk (`--font-display`), headings weight 500, line-height 1.1, letter-spacing -0.02em, `text-wrap: balance`. Scale: h1 clamp to 3.5rem, h2 3rem, h3 1.5rem.
- **Body**: Inter (`--font-sans`), 1rem/1.6, max 70ch.
- **Mono**: JetBrains Mono (`--font-mono`) for commands, code, keycaps, terminal frames, and small labels.
- All via `next/font/google` (self-hosted at build, CSS variables).

## Components

- **Navbar**: floating pill, `max-w-6xl rounded-2xl`, `bg-surface` + `hairline` border + `backdrop-blur-xl`, sticky with top offset; icon left, centered links, theme toggler + yellow pill CTA right; hamburger collapse on mobile.
- **Buttons**: pill (`rounded-full`). Primary: solid `--brand`, `--on-brand` text, medium weight. Secondary: `--surface-2` fill + `--hairline-strong` border. Focus: 2px `--brand` ring offset.
- **Cards**: `rounded-2xl`, `--surface` fill, `--hairline` border, hover raises to `--surface-2` + `--hairline-strong`. No side-stripes, no glass.
- **Terminal window**: `rounded-xl` chrome bar (three dots, mono title) over a mono body on `--background`-adjacent fill; renders the CLI's actual menu (yellow badge, green active row, hotkey footer).
- **Code block**: mono, `--surface` fill, hairline border, copy button, `$` prompt in yellow.
- **Kbd**: mono keycap, `--surface-2`, hairline, rounded-md, 0.8em.
- **Docs shell**: pinned sidebar (sections: Guides / Reference), content column `max-w-[70ch]`, prev/next pager.

## Layout

- Container `max-w-6xl`, gutter `px-5`.
- Section rhythm 6-7rem vertical; landing alternates full-bleed and contained moments.
- Bento/feature grids: CSS grid with deliberate spans, not identical card rows.

## Motion

- GSAP (`useGSAP` + ScrollTrigger): hero terminal typing timeline, scroll reveals that enhance already-visible content (opacity/translate from 0.92 visible states, never hidden-by-default).
- `motion/react`: hover micro-interactions (card lift 2px + border brighten, CTA arrow nudge, bento stagger on first paint).
- Theme switch: MagicUI animated toggler (View Transitions clip-path reveal, guarded fallback).
- Easing: expo/quart ease-out, 200-500ms. Every animation has a `prefers-reduced-motion` instant alternative.
