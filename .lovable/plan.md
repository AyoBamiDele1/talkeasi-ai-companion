## Plan: Hide public status badges

### What we'll change
- In `src/components/RealtimeVoiceInterface.tsx`, remove the public status badge block that displays:
  - "Connecting..." / "Session Active" / "Session Inactive"
  - "AI Speaking"
  - "Recording..."
  - "Processing..." (which currently wraps `ProcessingIndicator`)

### What we will NOT change
- The underlying state variables (`isConnecting`, `isSessionActive`, `isRecording`, `isProcessing`, `isAISpeaking`, `isSpeaking`) remain intact — they drive the actual conversation logic and orb animations.
- The `ProcessingIndicator` component itself stays in the codebase (still used by `LessonSession.tsx`).
- The WebSocket, VAD, audio encoding, and playback pipeline are untouched.

### Why it's safe
Those labels are read-only UI. Removing them does not alter timing, recording control, credit deduction, or session lifecycle.

### Verification
- Build passes.
- `/home` conversation start screen no longer shows status badges above the Nova orb.
- Voice session still starts/stops/responds normally.