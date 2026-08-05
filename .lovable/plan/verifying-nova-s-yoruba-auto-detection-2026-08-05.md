# Verifying Nova's Yoruba auto-detection

## Why I can't run the live test myself

A true test means speaking Yoruba into a microphone during a live Gemini session. Two blockers:

- The browser automation available here has no microphone; it cannot produce real speech into the voice pipeline.
- This project's Supabase is external/unmanaged, so no signed-in session can be created in the sandbox to reach the authenticated talk screen.

So the live confirmation has to be done by you, in the preview. Below is what I can verify automatically, plus the exact manual script.

## What I can verify without audio

1. Confirm the language codes reach the edge function: log the resolved `autoLanguages` and the final system instruction in `gemini-realtime` at session start, then read the edge function logs after you open a session. This proves the `LANGUAGE DETECTION` block is actually present in the prompt sent to Gemini.
2. Confirm all three session paths (Standard, Premium, Trial) send the same `autoLanguages` payload.

## Manual test script (2 minutes, uses your credits)

1. Open the preview, start a Nova Live session.
2. Speak English first — confirm Nova replies in English (default behaviour intact).
3. Say a simple Yoruba line, e.g. "Bawo ni, se daadaa ni?" — Nova should reply in Yoruba.
4. Continue one more Yoruba turn to confirm it stays in Yoruba rather than snapping back.
5. Switch back to English — Nova should return to English.

Report results and I'll tune the prompt.

## Likely tuning if it fails

- Nova answers Yoruba in English: strengthen the prompt so the reply language mirrors the user's spoken language, with an explicit example turn.
- Nova mixes English words into Yoruba: add an instruction allowing natural code-switching only where no common Yoruba word exists.
- Nova drifts to Yoruba unprompted: tighten the "default to English unless the user speaks Yoruba" wording.

## Technical notes

- Prompt logic lives in `supabase/functions/gemini-realtime/index.ts` (`buildSystemInstruction`, lines ~89-90 gate on `autoLanguages.includes('yo')`).
- Client payload originates in `src/components/RealtimeVoiceInterface.tsx` (three call sites) and passes through `src/utils/RealtimeAudio.ts`.
- Temporary logging would be added to the edge function only, and removed after verification.
- Greeting and UI labels stay English — unchanged by this work.
