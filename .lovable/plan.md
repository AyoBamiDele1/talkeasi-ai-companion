# Fix the Google sign-in 403

The 403 "you do not have access to this document" comes from Google, before Supabase is ever reached. The app code is fine — `signInWithOAuth({ provider: 'google' })` already redirects correctly (the Supabase auth log shows a successful 302 to Google). The block is in the Google Cloud Console OAuth configuration.

## Most likely causes, in order

1. **Consent screen audience is "Internal"** — only accounts inside a Google Workspace org can sign in; everyone else gets exactly this 403.
2. **Consent screen is in "Testing"** and the account signing in is not on the test-user list.
3. **The OAuth client was created in a different Google Cloud project** than the consent screen you configured.

## Steps to run in Google Cloud Console (project: TalkEasi Project v052026)

1. APIs & Services → OAuth consent screen → **Audience**
   - Set User type to **External**.
   - If status is **Testing**, either click **Publish app** (recommended, so anyone can sign in) or add the test accounts under **Test users**.
2. Same screen → **Branding**: app name, support email, and developer contact email must all be filled in, otherwise publishing is blocked.
3. APIs & Services → **Credentials** → your Web application OAuth client:
   - Authorized JavaScript origins: `https://talkeasi.com`, `https://www.talkeasi.com`, `https://talkeasi-ai-companion.lovable.app`, `https://id-preview--ffaa8be9-9e82-4f37-9ffa-0ba2bc3ce036.lovable.app`
   - Authorized redirect URI (exactly one, no wildcard): `https://qcxjjhgfgyfhwacxppcp.supabase.co/auth/v1/callback`
4. Supabase → Authentication → Providers → Google: Client ID and Client Secret pasted from that same OAuth client, provider enabled.
5. Supabase → Authentication → URL Configuration: Site URL `https://talkeasi.com`, plus the wildcard redirect URLs already listed.

Google config changes can take a few minutes to propagate; retry in a fresh incognito window.

## Code changes

None required. If, after the console fixes, sign-in returns to the app but drops the session, the next step would be adding a dedicated `/auth/callback` handling path — but that is only worth doing once the 403 clears.
