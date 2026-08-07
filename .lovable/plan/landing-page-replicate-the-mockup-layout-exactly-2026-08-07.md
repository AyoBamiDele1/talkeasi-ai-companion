# Landing page — replicate the mockup layout exactly

Rebuild the landing page so its structure, section order, and composition match the shared mockup. Copy, palette (navy + coral), and fonts stay as they are today. No pricing section.

## Section-by-section

**Nav** — Left: orb + `TalkEasi` wordmark. Center: anchor links (Features, How It Works, FAQ — no Pricing). Right: pill "Start free talk" button. Sticky, transparent over background.

**Hero** — Full-bleed (no card wrapper), two columns:
- Left: small coral eyebrow ("Nova is listening"), large two-line headline with the second line in coral, supporting paragraph, pill CTA with a short label beside it ("no sign-up needed"), and a check-mark trust line beneath.
- Right: the real phone screenshot on a soft purple/coral radial glow, with two small ring accents floating around it, as in the mockup.

**Features band (new section, uses existing "Why Nova" copy)** — Centered two-line heading ("A real conversation, built for you" style, second line coral), then three icon columns separated by thin vertical dividers: circular coral-tinted icon, bold title, two-line description. Uses three of the four existing WhyNova items; the fourth moves into the use-case grid or is dropped to keep the row of three.

**How it works** — Centered heading with a short coral underline rule. Left column: vertical numbered timeline (coral circles connected by a line) listing the existing steps. Right column: the abstract Nova orb / aura visual (no illustrated character, no new photography) to fill the mockup's image slot.

**Use cases** — Centered heading with the second phrase in coral, then a four-card row (2x2 on mobile) with icon, bold title, short description — the four existing use cases.

**FAQ** — Centered heading with coral underline rule, then narrow-width collapsed rows: each question in a filled rounded bar with a chevron on the right that rotates open.

**Final CTA** — Wide rounded panel with a purple-to-coral gradient wash. Left: the phone screenshot with two floating badge bubbles. Right: heading, one-line subcopy, coral pill CTA, and a small trust line ("Start free · 1 credit = 1 minute").

**Footer** — Orb + wordmark on the left, link groups across the middle/right, copyright line centered underneath.

## Decisions carried over

- No pricing section, per earlier instruction — the nav omits the Pricing link too.
- No illustrated character; the mockup's illustration slot is filled with the existing Nova orb aura visual.
- All headline, body, FAQ, and CTA copy stays exactly as written today.

## Technical notes

- Work stays in `src/components/landing/*` and `src/pages/Index.tsx` (section order).
- `SectionShell` loses the card wrapper and becomes a plain centered section header (eyebrow/heading + optional coral rule); alternating sections get a subtle background tint band instead of individual cards.
- Any new gradient/glow values go into `src/index.css` as semantic tokens; no hardcoded colors in components.
- Icons come from lucide-react. All multi-column grids collapse to one column below `md`.
- FAQ JSON-LD, `/trial` and `/auth` routes, and the logged-in `/home` redirect are unchanged.
