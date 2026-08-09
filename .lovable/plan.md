# Plan: Enable Google Sign-In for TalkEasi

## Goal
Allow users to sign up / log in with Google on both the landing page and the auth page, bypassing the current Supabase email rate-limit issue.

## What is already done
- The "Sign up with Google" UI button is already added to `/auth` and the landing page Hero.
- The app uses `supabase.auth.signInWithOAuth({ provider: 'google' })` and listens for `onAuthStateChange`.
- The `handle_new_user()` trigger already creates a TalkEasi profile + welcome credits for every new Supabase auth user.

## What you still need to do

### Step 1: Create a Google Cloud project
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. At the top, click the project selector → **New Project**.
3. Name it something like `TalkEasi Auth` (or `NovaDela Technologies`).
4. Pick a billing account (Google OAuth itself is free, but a billing account is required on the project).
5. Click **Create**.

### Step 2: Configure the OAuth consent screen
1. In the Google Cloud console, go to **APIs & Services → OAuth consent screen**.
2. Select **External** (so any Google user can sign up).
3. Fill in the app details:
   - **App name:** TalkEasi
   - **User support email:** your email
   - **App logo:** optional — skip for now to avoid extra verification
   - **Developer contact information:** your email
4. Click **Save and Continue**.
5. On the **Scopes** step, click **Add or Remove Scopes**.
6. Add these non-sensitive scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Click **Save and Continue**.
8. On the **Test users** step, add your own email so you can test before publishing.
9. Click **Save and Continue**.
10. Click **Back to Dashboard**.

### Step 3: Create OAuth 2.0 credentials
1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. For **Application type**, choose **Web application**.
4. Name it `TalkEasi Web`.
5. Under **Authorized JavaScript origins**, add:
   - `https://talkeasi.com`
   - `https://www.talkeasi.com`
   - `https://talkeasi-ai-companion.lovable.app` (for preview / dev testing)
   - `http://localhost:8080` (for local development)
6. Under **Authorized redirect URIs**, add the Supabase callback URL. You can find it in your Supabase dashboard under **Authentication → Providers → Google**. It usually looks like:
   - `https://qcxjjhgfgyfhwacxppcp.supabase.co/auth/v1/callback`
7. Click **Create**.
8. Google will show you the **Client ID** and **Client Secret**. Copy both — you will paste them into Supabase in the next step.

### Step 4: Enable Google provider in Supabase
1. Go to your Supabase project dashboard: [https://supabase.com/dashboard/project/qcxjjhgfgyfhwacxppcp/auth/providers](https://supabase.com/dashboard/project/qcxjjhgfgyfhwacxppcp/auth/providers).
2. Click **Google** in the providers list.
3. Turn it **Enabled**.
4. Paste the **Client ID** from Google Cloud into the **Client ID** field.
5. Paste the **Client Secret** from Google Cloud into the **Client Secret** field.
6. Save.

### Step 5: Set the correct redirect URLs in Supabase
1. In Supabase, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your production root:
   - `https://talkeasi.com`
3. Under **Redirect URLs**, add the same Supabase callback URL you used in Google Cloud:
   - `https://qcxjjhgfgyfhwacxppcp.supabase.co/auth/v1/callback`
4. Save.

### Step 6: Publish the TalkEasi app
After the Google provider is enabled and the credentials are saved, publish the app so the live `talkeasi.com` domain matches the origins/redirects you configured above.

### Step 7: Test the flow
1. Visit the live site or preview.
2. Click **Sign up with Google**.
3. Choose a Google account.
4. After redirect, you should land on `/home` (or the intended post-login route) and a new row should appear in **Supabase Auth → Users** and the `public.profiles` table with the 5 welcome credits.

## Important notes
- If you add the Google logo to the consent screen, Google may require verification before External apps can be used by the public.
- For now, keep the logo off to avoid verification delays.
- After testing, go back to **OAuth consent screen → Publish App** to make it available to all Google users.
- Once email SMTP is configured, you can re-enable "Confirm email" for password-based signups while keeping Google sign-in available.

## No code changes needed
The front-end code already handles Google OAuth. This plan is purely dashboard configuration.