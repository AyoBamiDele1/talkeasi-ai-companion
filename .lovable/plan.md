## Goal

Make purchased credits show up immediately and reliably after checkout, for both Stripe and Paystack — no manual page refresh needed.

## What's wrong today

1. **Realtime is not actually enabled on `user_credits`.** The `useRealtimeCredits` hook subscribes to Postgres changes, but the table is not in the `supabase_realtime` publication and its replica identity is `default`. So balance changes are never pushed to the UI — it only updates on a fresh fetch (page load/navigation).
2. **Stripe success page has a race.** After Stripe checkout, `/payment-success` gets no reference, shows success, and redirects to `/profile` after 8s relying on a single mount fetch. If the async Stripe webhook hasn't credited the account yet, the user sees a stale balance until they refresh again.

Paystack already works (verify-on-return credits the DB and refetches), but it also benefits from live updates.

## Fix

### 1. Enable realtime on `user_credits` (migration)

- Set `REPLICA IDENTITY FULL` on `public.user_credits` (so the `user_id` filter matches on UPDATE events).
- Add `public.user_credits` to the `supabase_realtime` publication.

This makes the existing `useRealtimeCredits` subscription fire, so any balance change (purchase, gift, deduction) updates the UI live wherever that hook is used.

### 2. Poll for the credited balance on the Stripe success page

`src/pages/PaymentSuccess.tsx`: when there is no Paystack reference (i.e. a Stripe return), instead of just waiting 8s, capture the balance on entry and poll `user_credits` every ~3s for up to ~30s until the balance increases (webhook landed). Show "confirming…" until then, then show the updated balance. Keeps a graceful fallback message if it never lands.

### 3. Use the live balance consistently (small)

Ensure the credit displays that matter after purchase (Profile balance) reflect the live value. Profile already refetches on mount and after Paystack verify; with realtime enabled it will also update live. No business-logic changes.

## Validation

- Confirm via DB that `user_credits` is in `supabase_realtime` and replica identity is `full`.
- Test a Paystack purchase: balance updates on return without manual refresh.
- Test a Stripe purchase: success page polls and shows the new balance once the webhook lands; confirm the live subscription pushes the update.

## Notes

- No changes to pricing, credit amounts, or the deduction logic.
- The Stripe path still depends on the `process-payment-webhook` endpoint being registered in the Stripe dashboard (the `STRIPE_WEBHOOK_SECRET` secret is present, which indicates it is); polling simply removes the perceived delay.
