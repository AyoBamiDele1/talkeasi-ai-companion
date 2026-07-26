## Goal

Replace the hand-built phone contents in the landing hero with a real screenshot of the app's Nova conversation screen, rendered at mobile size inside the existing phone frame.

## Steps

1. **Capture the real screen**
   - Run the app locally via Playwright at a mobile viewport (390x844, dpr 2), restore the injected Supabase session, and navigate to the AI companion conversation route (`/lesson/ai-companion`).
   - Wait for the screen to settle in its idle/pre-session state (NovaOrb, credits pill, Nova Live button visible) and screenshot only the app viewport — no browser chrome.
   - If the authenticated session isn't available, fall back to capturing `/trial`, which renders the same voice interface publicly.

2. **Add the image to the project**
   - Save the capture as `src/assets/nova-screen.png` (kept as a normal image import).

3. **Update `src/components/landing/Hero.tsx`**
   - Keep the phone frame: rounded bezel, notch, rotation, float animation, shadow.
   - Delete the fake inner markup (credits pill, "AI Companion" title, speaking-time chip, greeting bubble, Session Inactive, Nova Live card).
   - Replace it with the screenshot inside the rounded inner area: `object-cover object-top`, `w-full`, clipped by the `rounded-[30px]` mask, with descriptive alt text ("Nova conversation screen in the TalkEasi app").
   - Keep the notch layered above the image.

## Notes

- Purely presentational — no routing, backend, or conversation-logic changes.
- Screenshot is static; if the conversation UI changes later, it needs a re-capture.
- Reduced-motion behavior on the float animation is preserved.
