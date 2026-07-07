# Add a warm hero illustration to the TalkEasi landing page

Make the landing page feel less plain by introducing a **soft flat-vector hero scene** and warming up the surrounding layout. Everything stays frontend-only and preview-only until you Publish.

## Deployment safety
Frontend change only. It shows in **preview** and does not touch live `talkeasi.com` until you click **Publish → Update**.

## The illustration
- Generate one **soft flat-vector hero illustration** in Nova's palette (coral/pink + warm accents on the deep navy background): a cozy, friendly scene — a warm rounded character relaxed and talking, with gentle gradient blobs and the NovaOrb glow woven in. Rounded, modern, Headspace/Calm-style warmth.
- Style rules: soft rounded shapes, coral/pink primary, gentle gradients, no harsh outlines, no text baked into the art, transparent or navy-matched background so it blends with the page.
- Saved as a project image asset and imported into the hero (with descriptive `alt` for SEO/accessibility).

## Hero layout change
Rebuild `src/components/landing/Hero.tsx` into a **two-column hero** on desktop, single-column stacked on mobile:

```text
 Desktop
 ┌───────────────────────────┬───────────────────────────┐
 │  Headline (H1)            │                           │
 │  Subhead                  │     Warm flat-vector      │
 │  [🎤 Start Free Talk]     │     hero illustration     │
 │  [Sign In]                │     (NovaOrb glow behind) │
 │  Free to try · no signup  │                           │
 └───────────────────────────┴───────────────────────────┘

 Mobile: illustration on top, text + CTAs below (centered)
```

- Keep the existing NovaOrb as a soft glowing accent behind/near the illustration rather than the sole visual.
- Keep all current copy, CTAs, and routing (`/trial`, `/auth`) unchanged.

## Small warmth pass (light touch)
- Add subtle warm radial glows behind the section headings so the lower sections don't read as flat cards on navy.
- Fix the broken emoji glyphs currently showing as boxes (the CTA "🎤", "Feeling stressed", "Need advice" cards) by replacing them with reliably-rendering lucide icons in Nova's coral, consistent with the other cards.

## Technical notes
- Generate the illustration with the image tool into `src/assets/` and import it as an ES6 asset in `Hero.tsx`.
- All colors via existing semantic tokens (no hardcoded colors); verify contrast on the navy background.
- Responsive: two-column `md:grid-cols-2` hero, image `loading="eager"` (above the fold) with width/height to avoid layout shift.
- No backend, DB, routing, or copy changes beyond the emoji-glyph fix.

## Out of scope
Card spot art, section-divider illustrations, and any other illustration styles — deferred. We can add those next if you like the hero direction.

I'll generate the illustration and rebuild the hero in preview on approval, then you review before publishing.