# Replace the homepage Nova orb with a person image

Replace the NovaOrb CTA on the authenticated `/home` page with a circular person photo while keeping the existing glow, pulse, and click-to-talk behavior.

## Scope
- Target: `src/pages/Home.tsx` lines 138–157 (the main "Talk to Nova" orb CTA).
- Out of scope: landing page logo orb, realtime conversation orb, brand name, copy, or routes.

## Decisions
- Image: generate a warm, friendly portrait of a person (gender-neutral, inclusive) and save it as a project asset.
- Shape: circular crop with a soft coral/purple glow ring so it still feels like the Nova orb but human.
- Interaction: keep the onClick handler that navigates to the AI companion route and preserve the pulse/listening animation states.
- Fallback: if generation fails, fall back to a placeholder silhouette with the same styling.

## Implementation

1. **Generate portrait asset**
   - Save to `src/assets/nova-person.png` (or a CDN asset if large).
   - Upload via `lovable-assets` if over 100 KB.

2. **Create reusable `PersonAvatar` component**
   - New file: `src/components/PersonAvatar.tsx`.
   - Props: `size`, `isActive`, `isListening`, `isSpeaking`, `onClick`, `className`.
   - Circular `img` with `object-cover` and a CSS/Tailwind glow ring that mimics the orb states.

3. **Update `src/pages/Home.tsx`**
   - Replace `<NovaOrb size="sm" ... />` with `<PersonAvatar ... />`.
   - Keep the surrounding text, button, and click handler unchanged.

4. **Verify**
   - Build the project (`bun run build`).
   - Check the `/home` preview to confirm the person image renders, the glow animates, and clicking still starts a talk session.

## Technical notes
- Keep the existing `NovaOrb` component intact for other screens.
- Add new CSS tokens to `src/index.css` only if needed for the glow ring (prefer Tailwind utilities otherwise).
- Preserve all accessibility: alt text, focus styles, and keyboard clickability.
