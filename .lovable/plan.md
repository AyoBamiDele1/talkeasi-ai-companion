# Add "Continue with Google" sign-up

Google sign-up bypasses Supabase's email sending entirely, so it isn't affected by the email rate limit. Existing profile/credits logic still applies: the `handle_new_user` trigger creates the profile and the 5 welcome credits automatically for Google users.

## What gets built

**Auth page (`/auth`)**
- A "Continue with Google" button at the top of the form, above email/password, with an "or" divider below it.
- Shown for both sign-in and sign-up modes (same button — Google handles both).
- Google "G" logo mark, full-width, styled to match the current auth card.
- Loading state while redirecting; error toast if the provider call fails.

**Landing page (`/`)**
- Secondary "Continue with Google" button in the Hero, directly under the existing "Start 2-minute free talk" button, in a lighter/outline style so the free-trial CTA stays primary.
- Same button in the header nav area next to "Sign in" is not added — keeping the nav uncluttered.

Both buttons call the existing `signInWithGoogle()` from `useAuth`, which already redirects to `/home` after success.

## One-time setup you must do (I can't do this for you)

Google sign-in won't work until the provider is configured on your external Supabase project:

1. Google Cloud Console → create OAuth 2.0 Client ID (Web application).
   - Authorized JavaScript origins: `https://talkeasi.com`, `https://www.talkeasi.com`
   - Authorized redirect URI: `https://qcxjjhgfgyfhwacxppcp.supabase.co/auth/v1/callback`
2. Supabase → Authentication → Providers → Google → enable, paste Client ID + Secret.
3. Supabase → Authentication → URL Configuration → Site URL `https://talkeasi.com`, and add redirect URLs for the preview domain and `https://www.talkeasi.com`.

Until step 2 is done, the button will return a "provider is not enabled" error.

## Technical notes

- No database or edge function changes; `signInWithGoogle` already exists in `src/hooks/useAuth.tsx`.
- New shared component `src/components/GoogleSignInButton.tsx` used by both `src/pages/Auth.tsx` and `src/components/landing/Hero.tsx`, so styling stays consistent.
- Google mark rendered as inline SVG (no new asset, no extra network request).
- Nothing goes live until you publish.
