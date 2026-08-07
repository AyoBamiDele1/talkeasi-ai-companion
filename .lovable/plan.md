# Landing page redesign — card-composition layout

Rebuild the landing page to match the layout and composition of the shared screenshot, while keeping TalkEasi's existing navy + coral palette, fonts, and all current copy. No pricing section.

## What changes

**Logo / wordmark**
- New shared `LandingLogo` component: the small Nova orb (existing `NovaOrb` at `xs` size, non-interactive) placed directly beside the `talkeasi` serif wordmark.
- Used in both the sticky nav and the footer.

**Hero**
- Same two-column composition as the screenshot: eyebrow label, large serif headline, supporting paragraph, primary CTA plus secondary link, and a trust line underneath.
- Right column keeps the real phone screenshot (`voice-chat-interface.png`) as the hero visual, sitting on a soft radial glow using the existing primary/accent tokens.
- Keeps the current headline, subcopy, and CTA labels exactly as written today.

**Section treatment**
- Move from flat, divider-separated bands to the screenshot's card composition: each section sits on a rounded, bordered surface with subtle inner glow, consistent section eyebrow + serif heading, and generous vertical rhythm.
- How It Works: three numbered cards in a row (stacked, centered on mobile) instead of the dotted-connector row.
- Use Cases: 2x2 card grid replacing the list rows, same four items and copy.
- Why Nova: 2x2 feature cards with the small dot marker retained.
- Safety: two-column card, unchanged copy.
- FAQ: same accordion, wrapped in the new card surface.
- Final CTA: full-width centered panel, keeps the two-line "Start free / 1 credit = 1 minute" label and the existing button.

**Kept as-is**
- All copy, all routes (`/trial`, `/auth`), the FAQ JSON-LD, and the logged-in redirect to `/home`.
- Colors, typography (Fraunces / Public Sans / JetBrains Mono), and existing semantic tokens. No new palette.
- No pricing section anywhere on the page.

## Technical notes

- Edits confined to `src/components/landing/*` plus a new `LandingLogo.tsx`; `src/pages/Index.tsx` only changes if section ordering shifts.
- Any new surface/glow values are added as semantic tokens in `src/index.css` (e.g. a card-surface gradient and soft shadow) rather than hardcoded colors in components.
- Responsive: all multi-column grids collapse to a single centered column below `md`.
