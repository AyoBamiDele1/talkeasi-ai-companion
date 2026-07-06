# TalkEasi Landing Page Rebuild (talkeasi.com / `/`)

Replace the thin onboarding card at the root route with a real, content-rich marketing landing page. Same URL (`/`), same routing behavior — just a much stronger first impression that reduces bounce and gives Google real content to index.

## Deployment safety
This is a frontend change. It appears **only in preview** until you click **Publish → Update**. Live `talkeasi.com` is untouched until then. You review first, ship when ready.

## Behavior (unchanged routing)
- `talkeasi.com` (`/`) → new landing page.
- Logged-in users still auto-redirect to `/home` (existing logic preserved).
- Primary CTA "Start 2-Minute Free Talk" → `/trial`.
- Secondary CTA "Sign In" → `/auth`.

## Design direction
Reuse the existing design system — no new brand. Warm minimal aesthetic, NovaOrb (pink/purple glow) as the visual anchor, semantic tokens only (no hardcoded colors), voice-first language throughout ("talk", never "chat"). Nova stays the warm, gender-neutral friend. No stock images (keeps with the no-images preference); NovaOrb + typography + soft gradients carry the visuals.

## Page sections (top to bottom)
1. **Hero** — NovaOrb, headline + subhead, primary CTA "🎤 Start 2-Minute Free Talk", secondary "Sign In". Reassures: free, no signup to try.
2. **How it works** — 3 steps: Tap to talk → Nova listens → Feel lighter. Reinforces zero-typing, voice-first.
3. **What you can talk about** — Stressed · Lonely · Need advice · Just want to vent (maps to real search intent).
4. **Why Nova** — Always available · Judgment-free · Remembers you · A warm friend, not a clinical bot.
5. **Private & safe** — conversations are private, family-friendly, and Nova gently points serious issues to professionals (matches existing safety rules; no medical/legal/financial advice).
6. **Start free** — "1 credit = 1 minute, first talk is free" mini pricing reassurance + CTA into `/trial`.
7. **FAQ** — 4–6 Q&As targeting long-tail search ("Is it okay to talk to an AI like a friend?", "Is TalkEasi private?", "Is it really free to start?", "What can I talk to Nova about?"). Doubles as FAQPage structured data.
8. **Final CTA band** + simple footer (links to trial, sign in, and legal/contact if present).

## SEO baked in (lightweight, since content now exists)
- Confirm/refine `index.html` `<title>` + meta description (already app-specific).
- Add **Organization + WebSite JSON-LD** in `index.html`.
- Add **FAQPage JSON-LD** matching the on-page FAQ.
- Ensure a single H1 (hero headline), semantic section headings, alt/aria where relevant.
- `canonical` + `og:url` → `https://talkeasi.com/`.
(Sitemap/referral loop are separate follow-ups — not part of this landing build.)

## Technical notes
- Rewrite `src/pages/Index.tsx`; extract sections into small components under `src/components/landing/` (Hero, HowItWorks, UseCases, WhyNova, SafetySection, FAQ, LandingFooter).
- Keep the existing logged-in redirect (`useEffect` → `/home`).
- Reuse shadcn `Button`, `Card`, `Accordion` (for FAQ), and existing NovaOrb component.
- All colors via semantic tokens; verify light-mode contrast.
- No backend or DB changes.

## Out of scope for this step
Referral/sharing loop, sitemap.xml, trial-modal funnel changes, paid ads — all deferred to later phases.

Ready to build the landing page in preview on approval.