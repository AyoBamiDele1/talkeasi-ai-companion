# Use a Supabase custom auth domain for TalkEasi

## Goal
Replace the default `qcxjjhgfgyfhwacxppcp.supabase.co` URL shown during Google sign-in with a branded `auth.talkeasi.com` (or similar) domain.

## Why this matters
Users see the Supabase project URL during the OAuth consent screen, which looks unprofessional and can reduce trust. A custom auth domain keeps the entire sign-in experience under the TalkEasi brand.

## Steps

1. **Confirm Supabase plan supports custom domains**
   - Requires Supabase Pro plan or higher.
   - Free/Starter plans do not allow custom auth domains.

2. **Choose the auth subdomain**
   - Recommended: `auth.talkeasi.com`.
   - Avoid using the root `talkeasi.com` for auth, since that is the marketing site / app.

3. **Add the DNS CNAME record**
   - In your domain registrar / DNS provider (wherever talkeasi.com is managed):
     - Type: `CNAME`
     - Name: `auth`
     - Value/Target: the Supabase provided endpoint (displayed in the Supabase Dashboard when adding a custom auth domain).
   - Wait for DNS propagation (usually minutes, up to 24 hours).

4. **Configure the custom auth domain in Supabase**
   - Go to Supabase Dashboard → Authentication → URL Configuration.
   - Add `auth.talkeasi.com` as the custom auth domain.
   - Verify the domain via the Supabase dashboard.

5. **Update Google Cloud OAuth redirect URIs**
   - In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID:
     - Replace or add the redirect URI using the new auth domain:
       `https://auth.talkeasi.com/auth/v1/callback`
     - Keep the old Supabase URI as a fallback until the new one is confirmed working, then remove it.

6. **Update site URL / redirect URLs in Supabase Auth**
   - Ensure Site URL and any additional redirect URLs still point to the correct TalkEasi pages (`https://talkeasi.com/home`, etc.).

7. **Test the sign-in flow end-to-end**
   - Sign out of the app.
   - Click "Sign in with Google".
   - Confirm the OAuth screen now says "continue to auth.talkeasi.com" (or talkeasi.com if configured that way).
   - Confirm successful login and redirect back to the app.

## Notes / Risks
- This is mostly external configuration; no code changes in the TalkEasi repo are required unless the auth domain is hardcoded somewhere.
- Google OAuth requires redirect URIs to match exactly, so the new URI must be added before removing the old one.
- SSL/TLS is handled automatically by Supabase once the domain is verified.
- If the current plan does not support custom auth domains, the user will need to upgrade Supabase first.
