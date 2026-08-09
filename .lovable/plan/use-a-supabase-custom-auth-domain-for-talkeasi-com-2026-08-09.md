Use a Supabase custom auth domain for talkeasi.com

Goal
Make the Google sign-in flow display `talkeasi.com` (or a dedicated auth subdomain) instead of `qcxjjhgfgyfhwacxppcp.supabase.co` on the consent/callback screens.

Why this is needed
The TalkEasi app is connected to an external Supabase project (qcxjjhgfgyfhwacxppcp). The Google OAuth consent screen currently shows the default Supabase auth URL because Supabase is the OAuth callback target. Lovable's custom-domain feature only controls where the app is hosted, not where Supabase handles auth. To brand the auth flow, we must configure a custom auth domain inside Supabase itself.

What we will do
1. Choose an auth domain
   - Option A (recommended): `auth.talkeasi.com` — clean, dedicated, and avoids conflicts with the Lovable-hosted app at `talkeasi.com`.
   - Option B: `talkeasi.com` — only possible if the root domain is not already used for the app; currently it is used by Lovable hosting, so this is not practical.

2. Verify the Supabase plan supports custom auth domains
   - Custom auth domains require a paid Supabase plan (Pro/Team/Enterprise). The free tier does not support this feature.
   - If the project is on a free plan, we must upgrade first or accept the default Supabase URL.

3. Add the required DNS record
   - Supabase will provide a CNAME target for the chosen auth domain.
   - Add a CNAME record at the domain registrar/DNS provider for `auth.talkeasi.com` pointing to that Supabase target.
   - If the domain was bought through Lovable, DNS records are managed in **Project Settings → Project → Domains → ⋯ → Configure → Manage DNS records**. If the domain is managed externally, add the CNAME at that registrar.

4. Configure the custom auth domain in Supabase
   - Open the Supabase dashboard for project `qcxjjhgfgyfhwacxppcp`.
   - Go to **Authentication → Settings → URL Configuration**.
   - Under **Custom Auth Domain**, add `auth.talkeasi.com` and verify ownership (Supabase checks the DNS CNAME).

5. Update the Google OAuth redirect URI
   - In Google Cloud Console, open the OAuth 2.0 Web Client ID used for TalkEasi.
   - Under **Authorized redirect URIs**, replace or add:
     `https://auth.talkeasi.com/auth/v1/callback`
   - Keep the existing `https://qcxjjhgfgyfhwacxppcp.supabase.co/auth/v1/callback` during the transition, then remove it once the new domain is verified and working.

6. Update Supabase redirect URLs
   - In Supabase → Authentication → URL Configuration, ensure the redirect URL list includes the new auth domain:
     - `https://auth.talkeasi.com/**`
     - `https://talkeasi.com/**`
     - `https://www.talkeasi.com/**`
     - `https://talkeasi-ai-companion.lovable.app/**`
     - `https://id-preview--ffaa8be9-9e82-4f37-9ffa-0ba2bc3ce036.lovable.app/**`

7. No code changes required
   - The existing `signInWithGoogle` call in `src/hooks/useAuth.tsx` uses `window.location.origin` for the final redirect and relies on Supabase to handle the OAuth callback.
   - Once Supabase recognizes the custom auth domain, the Google OAuth flow will automatically use it for the callback and consent screens.

Verification
- After DNS propagates, visit `https://auth.talkeasi.com` and confirm it resolves to Supabase.
- Click the Google sign-in button in the app and confirm the browser shows `auth.talkeasi.com` (or a Google URL that redirects to it) instead of the raw Supabase project URL.
- Confirm the final redirect still lands on `https://talkeasi.com/home`.

Notes and risks
- DNS propagation can take up to 72 hours but usually completes in minutes.
- During the transition, keep both redirect URIs in Google Cloud Console to avoid locking users out.
- If the custom auth domain setup fails, the app can fall back to the default Supabase URL, which is already working today.