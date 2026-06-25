# Add Male Voice Option to Nova Live

Let users choose between a female and male voice for Nova before starting a conversation. Female stays the default, so nothing changes for existing users unless they pick male.

## What the user sees

- On the Nova start screen (before a session begins), a small **Voice** toggle with two options: **Female** and **Male**.
- The chosen voice is remembered on the device, so it persists across sessions.
- Once selected, every new conversation uses that voice. The toggle is hidden while a session is active.

```text
   ┌─────────────────────────────┐
   │  Voice:  [ Female ] [ Male ] │
   ├─────────────────────────────┤
   │  📞  Nova Live   1 credit/min │
   │  Natural conversation flow    │
   └─────────────────────────────┘
```

## How it works

- **Female = Aoede** (current default voice, unchanged)
- **Male = Charon** (an official Gemini Multimodal Live prebuilt voice)
- The choice is saved in `localStorage` and passed along with the existing conversation setup. The backend validates it against an allowlist and falls back to the female voice if anything is missing or invalid — so existing behavior is fully preserved.

## Technical details

**1. `src/components/RealtimeVoiceInterface.tsx`**
- Add a `selectedVoice` state initialized from `localStorage` (key e.g. `nova_voice`), defaulting to `"Aoede"`.
- Render a small toggle (using the existing `ToggleGroup` UI component) in the "Mode Selection" block (`!isSessionActive`), with Female → `Aoede` and Male → `Charon`. Persist to `localStorage` on change.
- Pass `voice: selectedVoice` into the `lessonContext` object given to `new RealtimeChat(...)` in all three start paths: `startHandsFreeSession` / Standard, Premium, and Trial sessions.

**2. `src/utils/RealtimeAudio.ts`**
- Extend the `lessonContext` constructor type to include an optional `voice?: string`. It's already forwarded verbatim to the edge function in the `lesson_context` payload, so no other change is needed.

**3. `supabase/functions/gemini-realtime/index.ts`**
- In `configureSession()`, read `lessonContext?.voice`, validate against an allowlist `["Aoede", "Charon"]`, and use it for `setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName`. Fall back to `"Aoede"` when missing/invalid.
- The function redeploys automatically.

## Safety / scope

- No changes to credits, streaks, milestones, auth, payments, web search, or the WebSocket/PCM audio pipeline.
- The `voice` field is optional with a safe server-side fallback, so current sessions keep working exactly as today.
- The robotic status-text change discussed earlier is intentionally **not** part of this plan.
