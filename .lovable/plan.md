# Multilingual system prompt update — safe version

## Answer first

Applying the pasted setup JSON **exactly as written** would break or degrade Nova. Not because of the language wording, but because the snippet is a stripped-down setup message that silently drops features the live session depends on.

## What the pasted snippet would remove

Current setup message in `supabase/functions/gemini-realtime/index.ts` (lines 278-336) contains these keys. The snippet has none of them:

- `inputAudioTranscription` / `outputAudioTranscription` — the only diagnostic signal for "Nova didn't respond" issues.
- `realtimeInputConfig.automaticActivityDetection.disabled = true` — the client sends explicit `activityStart` / `activityEnd`. If automatic VAD comes back on while the client still sends manual activity markers, turn-taking breaks.
- `contextWindowCompression.slidingWindow` — without it Gemini Live hard-closes the socket after roughly 1-2 minutes.
- `sessionResumption` — the reconnect/resume that survives the ~75s edge-worker recycle.
- `tools.functionDeclarations.search_web` — web search stops working.

Two more conflicts:

- `voiceName: "Puck"` overrides the existing validated voice picker (Aoede default / Charon male, allowlisted at lines 274-276). Hardcoding Puck removes the user's voice choice.
- The replacement prompt text is one paragraph. The live prompt (lines 118-177) carries Nova's identity rules, safety/crisis protocol, memory injection, Nigerian English rapport, affective dialogue style and the "not an assistant" framing. Replacing it wholesale drops all of that.

Also note the snippet's persona ("companion for elderly users and caregivers, created by NovaDela Technologies") is a different product positioning than the current Nova.

## What I'd do instead

Keep the entire existing setup message untouched. Change only the language block inside `buildSystemInstruction()`:

1. Widen `src/config/companion.ts` `supportedLanguages` to include Hausa (`ha`), Igbo (`ig`) and Swahili (`sw`) alongside English and Yoruba.
2. Replace the Yoruba-only `yorubaContext` (lines 110-116) with a generic language block built from the `autoLanguages` list the client already sends, e.g.:
   - Default language is English.
   - Understand and reply in Yoruba, Hausa, Igbo or Swahili whenever the user speaks them, including greetings such as "Ẹ n lẹ o", "Báwo ni", "Sannu", "Kedu", "Habari".
   - Match the user's language immediately and stay in it until they switch back.
   - Speak naturally and culturally respectfully; do not mix languages unless the user does.
3. Update the client payload in `src/components/RealtimeVoiceInterface.tsx` (three call sites: standard, premium, trial) to send `autoLanguages: ['en','yo','ha','ig','sw']`.
4. Leave the existing `[lang]` log line so the resolved languages and the presence of the language block can be confirmed in edge function logs.

## Audio specs

No change needed. Microphone capture already streams raw 16-bit PCM mono little-endian at 16kHz and playback decodes the 24kHz output chunks. Nothing in this work touches the audio path.

## Not changing

Welcome greeting and all UI labels stay in English, as previously agreed.
