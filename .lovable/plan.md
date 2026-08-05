## Goal

Add automatic Yoruba language detection to Nova so that if a user speaks Yoruba, Nova understands and replies in Yoruba. The app UI text labels and the initial welcome greeting remain in English.

## Current state

- The primary voice path uses the Gemini Multimodal Live API via `supabase/functions/gemini-realtime/index.ts`.
- The system prompt is built in `buildSystemInstruction()` and currently instructs Nova to act as a friendly English-speaking companion.
- The fallback tap-to-talk path uses OpenAI Whisper STT and OpenAI TTS, both hardcoded to English (`utterance.lang = 'en-US'`).
- `src/config/companion.ts` centralizes companion behavior (name, safety rules, Nigerian expressions) and is the right place for a language list.

## Steps

1. **Language support map**
   - Add a `supportedLanguages` array in `src/config/companion.ts` with `{ code: 'yo', name: 'Yoruba' }`. Design it so Hausa, Igbo, and others can be appended later.

2. **Update Gemini Live system prompt for auto-detection**
   - In `supabase/functions/gemini-realtime/index.ts`, extend the `buildSystemInstruction()` function so the AI Companion prompt explicitly tells Nova:
     - Default to English.
     - When the user speaks in Yoruba, understand and reply in Yoruba.
     - Do not mix languages unless the user does.
   - Keep the existing English welcome greeting unchanged; the only change is Nova's willingness to converse in Yoruba.

3. **Pass language detection intent to the backend**
   - In `src/utils/RealtimeAudio.ts`, ensure the `lessonContextToSend` payload can carry a `languageDetection: true` flag or an `autoLanguage: ['yo', 'en']` list. The server already receives the lesson context, so no new WebSocket protocol is required.

4. **Fallback STT/TTS path (English-only hardcoding)**
   - In `src/components/RealtimeVoiceInterface.tsx` and `src/pages/LessonSession.tsx`, the non-realtime fallback sends audio to `speech-to-text` and speaks via `text-to-speech`. For this phase, leave the fallback as-is because the main experience already uses Gemini Live, and adding Yoruba to the fallback would require a Yoruba-capable TTS provider. Note this as a future improvement rather than a deliverable now.

5. **Validation**
   - Add a small test harness in the edge function or a manual checklist: start a session, speak "Bawo ni?" and verify Nova replies in Yoruba.
   - Confirm that speaking English still receives an English reply.

## Notes

- No UI labels or welcome greeting will be translated; this is purely a runtime behavior change in the conversation layer.
- The system prompt change is the primary lever; Gemini Live already supports multilingual audio natively.
- The change is scoped to Yoruba first. The companion config and context payload are designed to make adding Hausa, Igbo, etc. a one-line addition later.
- After the plan is approved, the implementation will be limited to the edge function system prompt and the companion config, plus a minor payload update in `RealtimeAudio.ts`.
