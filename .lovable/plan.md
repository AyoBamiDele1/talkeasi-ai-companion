# Fix long email addresses spilling out of cards

## Problem
On the Profile page user-info card, the email address `novadelatechnologies@gmail.com` overflows the card boundary on narrow/mobile viewports because it is rendered as one unbroken word inside a flex item that is not allowed to shrink or wrap.

## Goal
Prevent long emails from spilling out of cards while keeping the full address accessible, and apply the same fix to any other email displays in the app.

## Approach
1. Update `src/pages/Profile.tsx`:
   - Add `min-w-0` to the text container (`<div className="flex-1">`) so flex shrink works correctly.
   - Add `break-all` (or `truncate` with a `title` tooltip) to the email `<p>` so it wraps or truncates instead of overflowing.
   - Keep the existing text size and color; only change overflow behavior.

2. Audit other email displays:
   - Search for `user?.email` and other rendered email addresses across the app.
   - Apply the same `min-w-0` + `break-all`/`truncate` pattern where needed (e.g., ProfileHelpSupport support email was already handled, but verify consistency).

3. Verification:
   - Open `/profile` on a mobile viewport.
   - Confirm the email stays inside the card and remains readable.
   - Confirm desktop layout is unchanged.

## Files likely to change
- `src/pages/Profile.tsx`
- Any other component found during the audit that renders a long email address without overflow control.
