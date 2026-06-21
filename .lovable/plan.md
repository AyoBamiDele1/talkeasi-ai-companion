# Update Support Email

Update `src/components/profile/ProfileHelpSupport.tsx`:

## 1. Email Support card
Change the "Email Support" contact option so it points to `support@novadelatech.com` (currently `novadelatech1@gmail.com`):
- `action` text → `support@novadelatech.com`
- `onClick` → `mailto:support@novadelatech.com`

## 2. App Information area
Add a new "Support & Enquiries" row in the App Information card showing `support@novadelatech.com` as a clickable mailto link, alongside the existing Version / Last Updated / Platform / Developer rows.

No other files or business logic change.