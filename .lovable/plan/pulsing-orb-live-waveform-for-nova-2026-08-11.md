# Pulsing Orb + Live Waveform for Nova

Add audio-reactive visuals to the voice experience without touching any conversation logic.

## Behaviour

**When Nova is listening (user speaking)**
- Soft, slow pulse on the orb (~3s cycle), very subtle glow bloom.
- Waveform sits low and calm, reacting gently to the user's mic level.

**When Nova is talking**
- Orb gently expands and contracts in time with Nova's actual output audio amplitude.
- Waveform bars animate from real frequency data of Nova's voice — they stop moving when she stops.

**Idle / connecting**
- Orb keeps its current gentle breathing; waveform flat and dim.

## Safety guarantees

- The visuals only *read* audio data. No change to the microphone capture pipeline, PCM encoding, Gemini WebSocket messaging, silence detection, or playback scheduling.
- Mic levels come from the analyser that already exists for silence detection — nothing new is inserted in the capture path.
- Nova's voice levels come from an analyser attached as a parallel tap on the existing playback AudioContext. An analyser is pass-through and is not routed to the speakers, so gap-free playback timing is unchanged.
- Respects `prefers-reduced-motion` (falls back to a static glow) and pauses animation when the tab is hidden.

## Where it appears

- The voice chat interface (authenticated talk screen).
- The trial page (`/trial`), which renders the same voice interface.

## Technical notes

- New `src/hooks/useAudioLevels.ts`: given an AudioContext + source, creates an `AnalyserNode` (fftSize 256, smoothing 0.8) and exposes amplitude + band values via a ref updated in a throttled `requestAnimationFrame` loop (~30fps). Values are written to refs and applied with direct style updates so React state does not re-render each frame.
- `src/utils/RealtimeAudio.ts`: expose the playback AudioContext and the output gain/source node so a read-only analyser can be attached. No changes to buffer scheduling or queue logic.
- `src/components/NovaOrb.tsx`: accept an optional `level` (0-1) input; scale and glow intensity derive from it. Existing CSS breathing animation stays as the fallback when no level is provided.
- New `src/components/VoiceWaveform.tsx`: canvas or bar-based waveform rendered under the orb, styled with existing primary/accent tokens, driven by the same analyser data.
- `RealtimeVoiceInterface.tsx`: wires the hook to the orb and waveform, choosing mic-analyser data while listening and playback-analyser data while Nova speaks. Existing state flags (`isListening`, `isSpeaking`) are read only.
