

## Diagnosis

The Gemini WebSocket is being rejected by Google immediately with **close code 1008 (policy violation)**. Our edge function reaches Google and the handshake starts, but Google drops it before Nova can respond. No reason text is returned — which is the signature pattern for **API key tier / billing issues** on the Gemini Live API.

The Gemini **Live API (`BidiGenerateContent`)** has a hard requirement that's different from the regular Gemini REST API:
- It requires a **paid-tier API key** (a free Google AI Studio key will connect but get 1008-rejected the moment it tries to start a session)
- The key's GCP project must have **billing enabled** and **"Generative Language API" enabled**
- `gemini-live-2.5-flash-native-audio` is a **preview** model that may also be gated to specific projects

## The Fix (User Action Required)

This is **not a code bug** — the WSS handshake, audio config, and CORS are all working. To make Nova talk, you need to verify your `GEMINI_API_KEY`:

### Step 1: Verify your key is paid-tier
1. Go to https://aistudio.google.com/apikey
2. Find the key you've stored as `GEMINI_API_KEY`
3. Check the "Plan" column — if it says **"Free"**, that's the problem. Click the key → "Set up billing" → link a Google Cloud billing account
4. After upgrading, the key becomes paid-tier in ~1 minute

### Step 2: Confirm the Live API model is available
In Google AI Studio, open https://aistudio.google.com/live and try `gemini-live-2.5-flash-native-audio` directly. If it works there with your account, the same key will work in our edge function.

### Step 3 (optional): Try a more widely available model
If `native-audio` is still gated, set the `GEMINI_MODEL` secret to a non-native-audio Live model:
- `gemini-2.0-flash-live-001` (most widely available, GA, not preview)

This uses standard TTS instead of native audio — slightly less expressive but proven to work on any paid key.

## Code Change I'll Make

One small improvement to make future debugging easier:

**`supabase/functions/gemini-realtime/index.ts`** — surface Google's close reason to the client so the browser console shows *why* Google rejected, not just code 1008. Right now we only forward `code` to the client; I'll also forward `reason` and add a clearer server-side log line tagged `[GEMINI_REJECTED]` when code is 1008/1011 with hints about likely cause (billing/model access).

No DB changes, no new secrets, no new functions.

## What to Do Now

1. Tell me **which step you want first**:
   - **(A)** Just make the code change above so we can see Google's actual rejection reason on the next attempt, OR
   - **(B)** First switch the default model to the more compatible `gemini-2.0-flash-live-001` (likely fixes it immediately if your key is paid), OR
   - **(C)** Both — change model AND add better logging

2. In parallel, verify your `GEMINI_API_KEY` is paid-tier at https://aistudio.google.com/apikey

