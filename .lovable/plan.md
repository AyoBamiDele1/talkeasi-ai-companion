# Enable Google Sign-In for TalkEasi

## Goal
Allow users to sign up and sign in with Google so TalkEasi bypasses the shared-SMTP email rate limit and registration friction. The front-end button and handler are already added; only the provider-side configuration remains.

## What you must do manually
These steps are performed in Google Cloud Console and the Supabase Dashboard — Lovable cannot automate them for you.

### Step 1: Create or choose a Google Cloud project
- Go to https://console.cloud.google.com/projectcreate
- Create a new project (recommended) or select an existing one.

### Step 2: Configure the OAuth consent screen
- In the same project, go to **APIs & Services > OAuth consent screen**.
- Choose **External** (required for any user with a Google account).
- Fill in the app name, user support email, and developer contact email.
- Under **Authorized domains**, add your Supabase project domain: `https://<project-ref>.supabase.co` (replace `<project-ref>` with your actual Supabase project reference).
- Add the non-sensitive scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
- Save.

### Step 3: Create OAuth 2.0 Web Client credentials
- Go to **APIs & Services > Credentials > Create credentials > OAuth client ID**.
- Choose **Web application**.
- Under **Authorized JavaScript origins**, add:
  - `https://id-preview--ffaa8be9-9e82-4f37-9ffa-0ba2bc3ce036.lovable.app`
  - `https://talkeasi-ai-companion.lovable.app`
  - `https://talkeasi.com`
  - `https://www.talkeasi.com`
  - `http://localhost:8080` (for local preview)
- Under **Authorized redirect URIs**, add the exact redirect URL shown in Supabase under **Authentication > Providers > Google**. It typically looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
- Save. Copy the **Client ID** and **Client Secret**.

### Step 4: Enable Google provider in Supabase
- In your Supabase Dashboard, go to **Authentication > Providers > Google**.
- Toggle it on.
- Paste the **Client ID** and **Client Secret** from Step 3.
- Save.

### Step 5: Set Site URL and Redirect URLs in Supabase
- Go to **Authentication > URL Configuration** in Supabase.
- Set **Site URL** to your production URL: `https://talkeasi.com` (or `https://talkeasi-ai-companion.lovable.app` if you are not using the custom domain).
- Add the same Lovable preview, production, and localhost URLs to **Redirect URLs**.
- Save.

### Step 6: Test in preview
- Open the Lovable preview at `https://id-preview--ffaa8be9-9e82-4f37-9ffa-0ba2bc3ce036.lovable.app/auth`.
- Click the **Continue with Google** button on the Sign Up or Sign In tab.
- Complete the Google flow and confirm a new user row appears in Supabase Auth and a profile is created with 5 credits.

### Step 7: Publish the app
- Once testing works in preview, publish the app from Lovable so the live site receives the same front-end code.
- Re-test on the published domain.

## Notes
- Google AI Studio is **not** needed for this setup. AI Studio is for Gemini API keys; OAuth credentials come from Google Cloud Console.
- Keep the consent screen as **External**. Do not switch to Internal unless you want to restrict sign-in to users inside a Google Workspace organization.
- If you add a new custom domain later, you must come back to Step 3 and Step 5 to add it.
