## Problem

The Paystack 700 Naira ("Snack Pack") recharge adds the wrong number of credits. The balance is being built by **string concatenation instead of numeric addition**.

Trace for the affected user (Johnson, balance now `26060`):
- Pre-purchase balance: `2`
- After 1st ₦700 recharge: `260` (correct would be `62`)
- After 2nd ₦700 recharge: `26060` (correct would be `122`)

`2 → 260 → 26060` is digits being glued together, not summed.

## Root cause

In `supabase/functions/gemini-realtime`… no — in `supabase/functions/paystack-verify/index.ts`:

```js
const credits = metadata.credits || PACKAGE_CREDITS[packageKey] || 0;   // "60" as a STRING
...
const newBalance = (currentCredits?.balance || 0) + credits;           // 2 + "60" = "260"
```

Paystack returns custom `metadata` values as strings, so `metadata.credits` is `"60"`. `number + string` in JS concatenates. That string ("260", then "26060") is written into the `user_credits.balance` integer column.

`paystack-sync` is already safe (it uses `Number(metadata.credits)`); only `paystack-verify` has the bug.

## Fix

### 1. `supabase/functions/paystack-verify/index.ts`
- Coerce credits to a number: `const credits = Number(metadata.credits) || PACKAGE_CREDITS[packageKey] || 0;`
- Defensively coerce the existing balance too: `const newBalance = Number(currentCredits?.balance ?? 0) + credits;`

This guarantees numeric addition for all future Paystack recharges.

### 2. Correct the affected balance (data fix)
Johnson's two ₦700 purchases are legitimate (60 + 60). Correct balance = pre-purchase `2` + `120` = **122**.
- Update `user_credits.balance` to `122` for user `e5fc942a-b241-4c32-9938-9311eaec230c`.
- Insert an `adjustment` row in `credit_transactions` recording the correction (from 26060 to 122) for an audit trail.

## Validation

- After the edge function redeploys, do a test ₦700 recharge and confirm the balance increases by exactly 60 (not concatenated), and `credit_transactions.balance_after` is the correct sum.
- Confirm the corrected balance shows `122` on the Credits & Subscription screen.

## Notes

- No pricing, package, or UI changes — packages remain Snack 60 / Buddy 200 / Bestie 500.
- The realtime balance updates added earlier will reflect the corrected value automatically once it changes.
