# Add NovaDela Tech attribution

Add a clear "TalkEasi is a product of NovaDela Tech" line to the **Profile → Help & Support** screen, inside the existing **App Information** card.

## Change

In `src/components/profile/ProfileHelpSupport.tsx`, within the App Information `Card`, add a new row alongside Version / Last Updated / Platform:

```text
Developer    NovaDela Tech
```

Plus a small centered footer line under the card content:

```text
TalkEasi is a product of NovaDela Tech
© 2026 NovaDela Tech. All rights reserved.
```

Styling uses existing tokens (`text-muted-foreground`, `text-xs`) to match the current card layout — no new colors or components.

## Out of scope
- No email/mailbox setup. (Separately: a real `support@talkeasi.com` inbox requires connecting an email host like Zoho/Google Workspace and adding MX records via Project Settings → Domains; sending branded email is possible through Lovable but receiving is not.)
- No changes to landing, auth, or other pages.
