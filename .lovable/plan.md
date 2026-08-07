# Replace the landing page "How it works" orb with a person image

Replace the Nova orb visual in the landing page `How it works` section (right-side of the two-column layout) with a photo of a person while keeping the section's layout, timeline, and copy unchanged.

## Scope
- Target: `src/components/landing/HowItWorks.tsx` — the orb/aura visual on the right side of the section.
- Out of scope: homepage CTA orb, realtime conversation orb, landing logo, timeline copy, heading, or FAQ.

## Decisions
- Image: generate a warm, friendly portrait of a person and save it as a project asset.
- Shape: circular crop with a soft coral/purple glow ring so it occupies the same visual space and still feels connected to the Nova brand.
- Layout: keep the existing two-column grid (timeline left, visual right) and responsive behavior.
- Animation: preserve the gentle floating/pulse animation currently applied to the orb so the person photo feels alive, not static.

## Implementation

1. **Generate portrait asset**
   - Save to `src/assets/nova-persona.png`.
   - If the file is over 100 KB, upload it via `lovable-assets` and use the `.asset.json` pointer.

2. **Update `src/components/landing/HowItWorks.tsx`**
   - Replace the orb/aura placeholder with a circular `<img>` wrapped in a glow container.
   - Keep the `floating` animation and the responsive container sizing.
   - Ensure the image still sits vertically centered on desktop and centers on mobile.

3. **Add supporting styles (if needed)**
   - Add a single `.persona-glow` or similar utility class to `src/index.css` only if the existing Tailwind tokens can't produce the desired halo.

4. **Verify**
   - Build the project (`bun run build`).
   - Check the landing page `/` preview at the "How it works" section to confirm the person image renders, the glow animates, and the layout does not break on mobile.

## Technical notes
- Keep the existing `NovaOrb` component intact for other screens.
- Use semantic tokens (`primary`, `accent`) for the glow ring, avoiding hardcoded colors.
- Provide meaningful alt text for the person image.
