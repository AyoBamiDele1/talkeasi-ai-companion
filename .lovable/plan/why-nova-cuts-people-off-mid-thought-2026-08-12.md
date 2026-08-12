# Why Nova cuts people off mid-thought

## Diagnosis (confirmed in code)

Nova does not use Google's automatic voice-activity detection. The edge function disables it (`realtimeInputConfig.automaticActivityDetection.disabled = true`), so the browser decides when the user's turn ends and sends an explicit "activity end" signal to Gemini. The moment that signal is sent, Nova starts replying.

The browser's end-of-turn rule is currently very impatient:

- Mic audio is processed in 512-sample chunks at 16kHz = **32ms per chunk**.
- A turn ends after **18 quiet chunks ≈ 0.58 seconds** of silence.
- "Quiet" means RMS at or below **0.009**, which is loud enough that soft trailing words ("...and, um, I think") register as silence.

Normal people pause 0.7–1.5 seconds while thinking mid-sentence. At a 0.58s cutoff, Nova jumps in during almost every natural thinking pause. That is the cut-off behaviour the tester reported.

A secondary contributor: once Nova starts talking, the barge-in gate is deliberately strict (1.6x louder start threshold, 8 sustained chunks), so a user trying to finish their thought over Nova is not heard immediately — the interruption feels one-sided.

## Proposed fix

1. Raise the end-of-turn silence window from ~0.58s to **~1.1–1.2s** (35–38 quiet chunks) so ordinary thinking pauses no longer end the turn.
2. Lower the silence threshold from 0.009 to **~0.006** so quiet trailing speech still counts as speech, not silence.
3. Add a short **grace re-open**: if the user resumes speaking within ~400ms of the turn ending and Nova has only just started, cancel/interrupt Nova's reply instead of talking over the user.
4. Soften barge-in slightly while Nova is speaking (start multiplier 1.6x -> ~1.35x, extra chunks +3 -> +2) so a deliberate interruption is picked up faster.

## Trade-off

Longer silence tolerance means Nova responds roughly half a second later after the user genuinely finishes. That is the correct trade: testers notice being interrupted far more than a small reply delay. If it ends up feeling sluggish, the window can be tuned down to ~0.9s.

## Technical details

All changes are in `src/utils/RealtimeAudio.ts` (client VAD constants and `processMicrophoneAudio`):

- `silenceChunksToEnd`: 18 -> 36
- `speechEndRms`: 0.009 -> 0.006
- barge-in: `startRms * 1.6` -> `* 1.35`, `speechStartChunksRequired + 3` -> `+ 2`
- new short post-`activityEnd` grace window that re-opens the turn and interrupts Nova's playback if the user resumes immediately

No edge function, prompt, model, or billing change. Existing `[ClientVAD]` console logs stay so the tuning can be verified from a live session.
