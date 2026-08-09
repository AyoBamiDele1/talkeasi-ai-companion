# Fix "email rate limit exceeded" on signup

## What's happening

Signups fail because Supabase's built-in email service is being used for confirmation emails. That built-in service is meant for testing only — it allows a very small number of emails per hour (a handful), shared across the whole project. Once that hourly cap is hit, every new signup returns `over_email_send_rate_limit` until the hour rolls over.

Confirmed in this project:
- There is no custom auth email hook or custom sender domain configured (no `auth-email-hook` function exists).
- Signup uses email confirmation (`emailRedirectTo` is set in `useAuth.tsx`), so every signup triggers an email.

This is a project configuration issue, not an app-code bug — no amount of frontend change will lift the cap.

## Recommended fix (do both)

### 1. Connect a real email sender (removes the cap)
Configure custom SMTP on the Supabase project so confirmation emails are sent through a real provider instead of Supabase's test mailer. Options: Resend, SendGrid, Mailgun, Amazon SES, or any SMTP host. This requires a sender domain you own (talkeasi.com works) with SPF/DKIM records added.

Where: Supabase Dashboard → Authentication → Emails → SMTP Settings.

### 2. Raise the auth email rate limit
Once custom SMTP is active, increase the hourly auth-email limit from the low default to something matching real signup volume.

Where: Supabase Dashboard → Authentication → Rate Limits → "Emails sent per hour".

## Optional stopgap (immediate, but a tradeoff)

If you need signups working right now before SMTP is set up, turn off "Confirm email" in Authentication → Providers → Email. New users would be signed in immediately without verifying their address. This removes the email send entirely, so the cap never triggers — but it also lets people register with addresses they don't own. Recommended only as a short bridge, then re-enable once SMTP is live.

## App-side improvement (code change I can make)

Right now a rate-limited signup surfaces a raw error. I'll update the signup handler in `src/pages/Auth.tsx` / `src/hooks/useAuth.tsx` to detect the `over_email_send_rate_limit` / 429 case and show a clear message such as "We're having trouble sending confirmation emails right now. Please try again in a few minutes." instead of the technical error string.

## Technical notes

- Error code: `over_email_send_rate_limit`, HTTP 429, from GoTrue.
- Default built-in limit is intentionally tiny and cannot be raised while using Supabase's test mailer.
- Nothing in the database or edge functions needs to change.
- Once SMTP is verified, we can optionally add branded auth email templates (custom design matching TalkEasi) as a follow-up.

## What I need from you

- Confirm whether you want to set up SMTP with a provider (and which one), and whether to apply the temporary "turn off email confirmation" stopgap in the meantime.
- The dashboard steps must be done by you on the Supabase project; I'll handle the app-side error messaging and any template work.
