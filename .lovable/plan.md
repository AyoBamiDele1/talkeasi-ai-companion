# Fix mobile layout on Help & Support page

## Problem
On mobile, the email address `support@novadelatech.com` in the App Information card touches the "Support" label because the row is too narrow for the long address.

## Goal
Reduce the email text size on small screens so it no longer collides with the label, while keeping the desktop size readable.

## Approach
Update `src/components/profile/ProfileHelpSupport.tsx`:
- Add a responsive text size class to the support email link (e.g. `text-xs sm:text-sm`).
- Optionally add a small gap (`gap-2` or `gap-3`) between the label and the email value for extra breathing room.
- Keep the existing color, hover underline, and mailto behavior unchanged.

## Files to change
- `src/components/profile/ProfileHelpSupport.tsx`

## Verification
- Open `/profile?view=help` on a mobile viewport.
- Confirm the "Support" label and email no longer touch.
- Confirm desktop layout remains unchanged.
