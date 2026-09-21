# Update Nova's introduction to mention advice and conversation practice

## Goal
When Nova introduces herself, she should say she's there for company, advice, and conversation practice — not just friendly chat.

## Current state
- First-time spoken intro (voice engine, `supabase/functions/gemini-realtime/index.ts`, CONVERSATION START): "Hi! I'm Nova ✦ So happy to talk with you! How are you doing today?" — mentions nothing about what she can help with.
- The "WHAT NOVA IS FOR" block already lists company, practical advice, conversation practice, and general talk — but only as background behavior rules, not in the intro.
- Returning-user spoken greeting (`src/utils/voiceGreeting.ts`): "Good evening, {name}! It's Nova. Welcome back!" — also doesn't mention capabilities.

## Changes

1. **First-time intro** (`supabase/functions/gemini-realtime/index.ts`): change the CONVERSATION START line to something like:
   "Hi! I'm Nova ✦ So happy to talk with you! I'm here for company, advice, or if you want to practice a conversation — how are you doing today?"

2. **Returning-user greeting** (`src/utils/voiceGreeting.ts`): extend the welcome-back line with a light mention, e.g. "Good evening, {name}! It's Nova. Welcome back! Ready to talk, get advice, or practice something?" — keeping the existing streak/time variations intact.

3. **Deploy** the updated `gemini-realtime` edge function and verify it's live.

## Notes
- Keep the ✦ mark and Nova's warm tone; the added mention stays short so the greeting doesn't feel scripted.
- No UI or pricing changes; prompt-only plus greeting text.
