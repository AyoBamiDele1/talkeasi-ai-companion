# Nav button: "Sign in / Sign up"

Change the top-right nav button on the landing page so it reads "Sign in / Sign up" and takes visitors to the auth page instead of straight into the free trial. Applies on both mobile and desktop.

## Changes

- In the landing nav, the pill button label becomes "Sign in / Sign up" and its click handler navigates to `/auth`.
- The separate text-only "Sign in" link (desktop/tablet only) is removed, since the pill now covers both actions.
- Styling of the pill stays exactly as-is (coral pill, hover lift).
- Nothing else on the page changes — the hero "Start 2-minute free talk" CTA still goes to the trial.

## Technical notes

- File: `src/components/landing/LandingNav.tsx` — swap the button's `onClick={onStartTrial}` for `onSignIn`, update the label, drop the sm-only sign-in link.
- `src/pages/Index.tsx` already passes `onSignIn` (navigates to `/auth`); no route or prop changes needed. The `onStartTrial` prop can remain for the nav's type signature or be dropped if unused.
