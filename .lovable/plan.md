# Fix: Google Sign-In should use real name, not email address

## Problem
When a user signs up with Google OAuth, the app greets them with their email (e.g., "Good evening, novadelatechnologies@gmail.com") instead of their Google name (e.g., "NovaDela Technologies").

## Root Cause
Confirmed from `auth.users.raw_user_meta_data` for the affected account: Google provides the name in the `full_name` and `name` metadata fields, but the `handle_new_user()` database trigger only checks for `display_name` and falls back to `email`. This leaves the `profiles.display_name` column set to the email address.

## Plan

### 1. Update the `handle_new_user` trigger to read Google name fields
Modify `supabase/functions/handle_new_user` logic (delivered as a new migration) so the `display_name` is populated from the first available source in this order:

- `raw_user_meta_data ->> 'full_name'`
- `raw_user_meta_data ->> 'name'`
- `raw_user_meta_data ->> 'display_name'`
- `email` (final fallback)

This fixes new signups without affecting the existing credit-bonus logic.

### 2. Backfill existing Google users
Add a one-time migration step that updates `profiles.display_name` for users whose current display name equals their email and whose `raw_user_meta_data` contains `full_name` or `name`. This will correct the greeting for the affected user and any other Google users in the same state.

### 3. Make client-side greeting more resilient
Update `src/utils/voiceGreeting.ts` and `src/pages/Home.tsx` so that when `profiles.display_name` is missing or equal to the email, the greeting logic also checks `user.user_metadata.full_name` and `user.user_metadata.name` before falling back to the email. This ensures the fix is visible even before a backfill runs and covers any edge cases where the profile is not synced.

### 4. Verify the fix
After deployment, confirm that the Google account now sees "Good evening, NovaDela Technologies" on the homepage and that the voice greeting uses the same name.

## Files to change
- New Supabase migration file for the trigger + backfill
- `src/utils/voiceGreeting.ts`
- `src/pages/Home.tsx`

## No changes needed
- Google OAuth provider configuration in Supabase / Google Cloud Console
- `src/components/GoogleSignInButton.tsx`
- `src/hooks/useAuth.tsx` (OAuth flow works correctly)
