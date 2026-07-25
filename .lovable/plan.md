
# Rebuild the landing page to match the attached mockup

Adopt the editorial, mature design from the uploaded `talkeasi-landing_3.html` — a serif/mono typography system, a phone mockup as the hero visual (no character illustration), and quiet, magazine-style sections. Deep navy background, coral accent, and Fraunces serif headings.

Only preview changes until Publish.

## Design system updates

- Add Google Fonts: **Fraunces** (serif, headings + italics), **Public Sans** (body), **JetBrains Mono** (eyebrows/labels) — loaded from `index.html`.
- Add Tailwind font families in `tailwind.config.ts`: `serif: Fraunces`, `sans: Public Sans`, `mono: JetBrains Mono`.
- Keep existing HSL tokens (navy bg, coral primary/accent) — palette already matches. No token changes needed.
- Body font becomes Public Sans; headings default to Fraunces serif with medium weight and italic gradient accent word.

## Section rewrites (`src/components/landing/`)

1. **Hero** — two-column: left = eyebrow dot ("Nova is listening") + serif H1 with italic gradient "anytime you need" + subhead + coral pill CTA + underlined ghost link "Read the FAQ" + mono note. Right = **phone mockup** replicating the real Voice Chat screen (notch, credits pill, "AI Companion" title, "Speaking time: 0:00", Nova greeting bubble with timestamp, "Session Inactive" pill, "Nova Live" coral button). Gentle float animation. Delete `src/assets/hero-nova.png`.
2. **HowItWorks** — replace boxed cards with a horizontal **connected flow**: three numbered circles ("01/02/03" in italic serif) joined by a dashed line, small headings + captions. Stacks vertically on mobile.
3. **UseCases** — replace card grid with an **editorial topic list**: single column, thin dividers between rows, mono "01–04" markers on the left, bold heading + muted caption on the right.
4. **WhyNova** — quiet **two-column list** with small coral dots before each heading, no cards.
5. **SafetySection** — inset **panel** with rounded border, section label + serif H2, then two-column private/limits items inside.
6. **FAQ** — native `<details>` accordions with `+` toggle rotating to `×`, serif question weight, thin dividers. Keep the existing `faqs` data and `FaqJsonLd`.
7. **FinalCTA** — centered **closing panel** with radial coral glow at top, mono label, serif H2, subhead, single coral pill CTA.
8. **LandingFooter** — slim: `talk` + coral `easi` wordmark left, small link row right (Try free / Sign in / Create account), copyright underneath.
9. **Nav (new)** — add a sticky translucent top nav in `Index.tsx`: `talkeasi` wordmark left, "Sign in" text link + coral "Start free talk" pill right.

## Preserved behavior

- Routing unchanged: primary CTAs → `/trial`, Sign in → `/auth`, logged-in redirect to `/home`.
- FAQ copy, JSON-LD, canonical, meta — unchanged.
- No backend, DB, or edge-function changes.

## Technical notes

- All colors via existing semantic tokens (`bg-background`, `text-primary`, `border-border`, etc.). The mockup's hex values already map cleanly to current tokens.
- Phone mockup built with pure Tailwind divs — no new assets.
- Respect `prefers-reduced-motion` on the float animation.
- Remove `src/assets/hero-nova.png` (import gone).

## Out of scope

Route changes, copy rewrites beyond what the mockup already contains, and any backend/pricing work.
