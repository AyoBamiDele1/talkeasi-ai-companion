# Make Nova feel less robotic — first pass

## Answer first

Testers likely feel the robotic quality because of three things working together: responses are capped at "2-3 sentences", the greeting is identical every session, and the prompt does not explicitly ask for verbal fillers, natural pauses, or emotional variation. We can fix this without touching the voice model or audio pipeline.

## Proposed first pass

### 1. Loosen response length and structure

Update the AI Companion system prompt in `supabase/functions/gemini-realtime/index.ts`.

- Remove the hard "2-3 sentences" cap.
- Replace it with: "Respond naturally. Match the user's energy. If they share a lot, reply with a short paragraph and a follow-up question. If they ask a quick thing, keep it brief."
- Explicitly allow trailing questions, follow-ups, and short emotional reactions.

### 2. Rotate the greeting / icebreaker

Currently the prompt always says: "Hi! I'm Nova ✦ So happy to talk with you! How are you doing today?"

- Replace with a small pool of warm, varied openers (3-5 options) selected per session or sent as a light instruction to the model.
- Examples: "Hi, it's Nova — I've been thinking about you. What's been going on?", "Hey! So good to hear your voice. Tell me something about today."
- Keep the first-time auto-greeting but vary it.

### 3. Add natural-speech instructions

Add a short block to the prompt asking for:

- Verbal fillers and natural reactions: "Hmm", "Oh, I see", "Wait, really?", "Aww".
- Occasional short affirmations while thinking is not possible in live audio, but natural sentence rhythm is.
- Avoid over-structured lists unless the user asks for one.
- React to the user's emotional state explicitly before answering.

### 4. Test voice prosody instructions (optional, low risk)

Gemini Live voices respond to prompt instructions. Add a line to the system prompt that asks Nova to vary pace, pitch, and warmth based on the emotional content of the reply (e.g., slower/softer when the user is sad, upbeat when celebrating). This does not change the voice model or voice selection; it just influences how the voice renders the text.

## What we will NOT change

- Voice model and voice selection (Aoede/Charon) remain unchanged in this first pass.
- Safety/crisis protocol stays intact.
- Audio pipeline and real-time config (VAD, resumption, transcription) are untouched.
- No new LLM calls or latency-increasing steps are added.

## How to verify

- Review the updated prompt text in the edge function.
- Deploy the edge function and run a short voice session.
- Compare greeting variety and response length against the current version.
- Ask testers to re-evaluate after the prompt changes.

## Rollback

Because this is only a prompt change, reverting means restoring the previous prompt string. No schema, API, or UI changes are required.
