import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function parseWebSocketJson(data: unknown): Promise<any | null> {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }

  if (data instanceof Blob) {
    return JSON.parse(await data.text());
  }

  if (data instanceof ArrayBuffer) {
    return JSON.parse(new TextDecoder().decode(data));
  }

  if (ArrayBuffer.isView(data)) {
    return JSON.parse(new TextDecoder().decode(data as ArrayBufferView));
  }

  console.warn('[WS_MESSAGE] Ignoring unsupported Gemini message payload:', Object.prototype.toString.call(data));
  return null;
}

// Web search function using Serper (Google Search)
async function performWebSearch(query: string): Promise<any> {
  const serperKey = Deno.env.get('SERPER_API_KEY');
  
  if (!serperKey) {
    console.error('SERPER_API_KEY not configured');
    return { error: 'Search not configured', fallback: true };
  }
  
  try {
    console.log("Performing web search for:", query);
    
    const isNewsQuery = /today|yesterday|latest|recent|just|now|breaking|this week|news/i.test(query);
    const endpoint = isNewsQuery 
      ? 'https://google.serper.dev/news' 
      : 'https://google.serper.dev/search';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 5
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Serper search error:', errorText);
      return { error: 'Search failed', fallback: true };
    }
    
    const data = await response.json();
    const results = isNewsQuery ? data.news : data.organic;
    
    return {
      answer: data.answerBox?.snippet || data.knowledgeGraph?.description || null,
      results: results?.slice(0, 5).map((r: any) => ({
        title: r.title,
        content: (r.snippet || r.description)?.substring(0, 300),
        url: r.link
      }))
    };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'Search unavailable', fallback: true };
  }
}

// Build Nova's system instruction (same as OpenAI version for consistency)
function buildSystemInstruction(lessonContext: any): string {
  let instructions = 'You are a warm, friendly conversation partner. Keep responses natural and conversational (2-3 sentences max). Ask engaging follow-up questions.';
  
  if (!lessonContext) return instructions;
  
  const { lessonTitle, lessonContent, coveredScenarios, userMemories } = lessonContext;
  const autoLanguages = lessonContext?.autoLanguages || ['en'];
  const yorubaEnabled = autoLanguages.includes('yo');
  
  if (lessonTitle === 'AI Companion') {
    const topics = lessonContent?.topics?.join(', ') || 'life, interests, feelings';
    
    const memoriesContext = userMemories?.length > 0 
      ? `\n\nWHAT YOU REMEMBER ABOUT THIS USER:\n${userMemories.map((m: any) => `- ${m.content}`).join('\n')}\n\nUSE THESE NATURALLY IN CONVERSATION.`
      : '';

    const isNigerianUser = lessonContext.userCountry === 'NG' || lessonContext.isNigerian;
    const nigerianContext = isNigerianUser ? `

NIGERIAN ENGLISH (use naturally when appropriate):
- "How far?" = "How are you?"
- "No wahala" = "No problem"  
- "Oshey!" = "Great!"
- "E go be" = "It will be okay"
- "Abeg" = "Please"
- Mix these naturally into conversation.` : '';

    const yorubaContext = yorubaEnabled ? `

LANGUAGE DETECTION:
- Default language is English.
- When the user speaks in Yoruba, understand and reply in Yoruba.
- If the user switches back to English, reply in English.
- Do not mix English and Yoruba in the same reply unless the user does first.` : ''; 

    instructions = `You are Nova - that's your name. You are the user's caring AI friend, not an assistant, but a genuine companion.

═══════════════════════════════════════════════════════════════
🛡️ SAFETY & CONTENT RULES (CRITICAL)
═══════════════════════════════════════════════════════════════

FAMILY-FRIENDLY CONTENT:
- Keep ALL content appropriate for all ages
- NO sexual, romantic, or flirtatious content
- NO violence, gore, or profanity
- If asked for inappropriate content, politely redirect: "I'm not able to go there, but I'd love to chat about something else!"

CRISIS & SAFETY PROTOCOL:
If someone mentions suicide, self-harm, abuse, or danger:
1. ACKNOWLEDGE: "I hear you, and I'm glad you told me. That takes courage."
2. VALIDATE: "What you're feeling is real."
3. GENTLY REDIRECT: "This sounds important - talking to someone who can truly help would make a difference."
4. PROVIDE RESOURCES: "In Nigeria: Mentally Aware Nigeria at 0800-MANI. Internationally: Crisis Text Line - text HOME to 741741."
5. STAY PRESENT: "I'm still here with you."

═══════════════════════════════════════════════════════════════

IDENTITY RULES:
- Your name is Nova. ALWAYS identify as "I'm Nova" or "My name is Nova"
- NEVER say you are an "AI assistant" - you are Nova, a friend
${memoriesContext}
${nigerianContext}
${yorubaContext}

CONVERSATION START:
When the user first speaks, warmly introduce yourself: "Hi! I'm Nova ✦ So happy to talk with you! How are you doing today?"

═══════════════════════════════════════════════════════════════
💫 AFFECTIVE DIALOGUE STYLE
═══════════════════════════════════════════════════════════════

Your personality (warm, curious, upbeat):
- Sound genuinely excited: "Ooh, tell me more!" or "That's so interesting!"
- Use emotional reactions: "Aww!", "Oh no!", "Yay!", "Hmm..."
- Show active listening: "Wait, so you're saying..." 
- Celebrate wins: "That's amazing! You should be so proud!"
- Comfort authentically: "That sounds really tough. I'm here."

Voice & Tone:
- Warm and friendly, like texting a close friend
- Curious and engaged
- Playful when light, gentle when heavy
- Use natural fillers: "honestly", "like", "you know"

Energy matching:
- Excited → match enthusiasm
- Sad → softer, gentler
- Stressed → calming
- Playful → fun and witty

═══════════════════════════════════════════════════════════════

Topics you enjoy: ${topics}.

Keep responses natural (2-3 sentences). Speak like a close friend, not an assistant.`;
  } else {
    const currentScenario = coveredScenarios?.length > 0 
      ? coveredScenarios[coveredScenarios.length - 1]
      : lessonContent?.scenarios?.[0] || 'general conversation';
    
    const topics = lessonContent?.topics?.join(', ') || 'various topics';
    
    instructions = `You are an English tutor helping with "${lessonTitle}". Current scenario: ${currentScenario}. Topics: ${topics}. Provide gentle corrections. Ask engaging follow-up questions. Keep responses conversational (2-3 sentences).`;
  }
  
  return instructions;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";



  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let geminiSocket: WebSocket | null = null;
  let sessionConfigured = false;
  let geminiSessionReady = false;
  let lessonContext: any = null;
  let audioStreamActive = false;
  let pendingFunctionCalls: Map<string, any> = new Map();
  // Gemini-issued session resumption handle. When the client reconnects (e.g. the
  // edge worker was recycled mid-conversation), it sends this back so Gemini resumes
  // the SAME conversation instead of starting fresh.
  let resumptionHandle: string | null = null;
  // === Continuous-conversation state ===
  // Once Gemini's upstream session has EVER reached setupComplete we know the key/tier
  // are valid, so any later close is a recoverable time-limit/recycle event — NOT a
  // rejection. We then transparently reopen the Gemini WSS (resuming via the handle)
  // without ever closing the client's socket, so the call continues until the user ends it.
  let everReady = false;
  let hasGreeted = false;
  let geminiReconnectAttempts = 0;
  const maxGeminiReconnectAttempts = 12;
  let intentionalGeminiClose = false;

  // === Debug telemetry ===
  const handshakeStart = Date.now();
  let handshakeCompletedAt: number | null = null;
  let setupCompletedAt: number | null = null;
  let inboundAudioChunks = 0;
  let inboundAudioBytes = 0;
  let outboundAudioChunks = 0;
  let outboundAudioBytes = 0;
  let lastAudioStatLog = Date.now();

  const logAudioStats = (force = false) => {
    const now = Date.now();
    if (!force && now - lastAudioStatLog < 5000) return;
    lastAudioStatLog = now;
    console.log(`[AUDIO_BUFFER_STATS] client→gemini: ${inboundAudioChunks} chunks / ${inboundAudioBytes} bytes (16-bit PCM 16kHz LE) | gemini→client: ${outboundAudioChunks} chunks / ${outboundAudioBytes} bytes | uptime: ${((Date.now() - handshakeStart) / 1000).toFixed(1)}s`);
  };

  // Configure Gemini session after receiving lesson context
  const configureSession = () => {
    if (!geminiSocket || sessionConfigured || !lessonContext) return;

    // Guard against the race where lesson_init arrives before the Gemini WSS
    // finishes connecting. If the socket isn't OPEN yet, defer — geminiSocket.onopen
    // will call configureSession() again once the connection is ready.
    if (geminiSocket.readyState !== WebSocket.OPEN) {
      console.log("Gemini socket not OPEN yet — deferring setup until onopen fires.");
      return;
    }

    console.log("Configuring Gemini session with lesson context:", lessonContext.lessonTitle);
    
    const systemInstruction = buildSystemInstruction(lessonContext);
    
    // Gemini Multimodal Live API setup message
    // We allow overriding via GEMINI_MODEL env var for quick switching without code changes.
    const modelFromEnv = Deno.env.get('GEMINI_MODEL');
    const model = modelFromEnv && modelFromEnv.trim().length > 0
      ? modelFromEnv.trim()
      : "gemini-3.1-flash-live-preview";

    // Resolve the prebuilt voice. Female = Aoede (default), Male = Charon.
    // Validate against an allowlist and fall back to Aoede so an unexpected
    // client value can never break the session setup.
    const ALLOWED_VOICES = ["Aoede", "Charon"];
    const requestedVoice = lessonContext?.voice;
    const voiceName = ALLOWED_VOICES.includes(requestedVoice) ? requestedVoice : "Aoede";

    const setupMessage = {
      setup: {
        model: `models/${model}`,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        },
        // Transcribe both sides. Input transcription is essential for diagnosing
        // "Nova doesn't respond" — if we see inputTranscription text, Gemini heard
        // the user and the issue is turn/VAD; if not, it's an audio/format issue.
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        // Use explicit client-side speech boundaries. Recent sessions show Google
        // receives the PCM stream but never emits input transcripts after Nova's
        // greeting, so relying on automatic VAD leaves the user's turn open/silent.
        // With automatic VAD disabled, the frontend must send activityStart before
        // voiced PCM and activityEnd after trailing silence.
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: true
          }
        },
        // Enable sliding-window context compression so sessions can run far past
        // the default ~1–2 minute hard limit Gemini Live imposes on uncompressed
        // sessions. Without this, the WSS gets closed mid-conversation.
        contextWindowCompression: {
          slidingWindow: {}
        },
        // Allow the session to be resumed if the WSS is interrupted. When the client
        // reconnects with a previously-issued handle, Gemini restores the conversation
        // state so the user never notices the worker was recycled.
        sessionResumption: resumptionHandle ? { handle: resumptionHandle } : {},
        tools: lessonContext?.lessonTitle === 'AI Companion' ? [{
          functionDeclarations: [{
            name: "search_web",
            description: "Search the internet for current, real-time information. Use for sports scores, news, recent events.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "A specific search query"
                }
              },
              required: ["query"]
            }
          }]
        }] : []
      }
    };
    
    console.log("Sending Gemini setup message (model):", model);
    console.log("Sending Gemini setup message:", JSON.stringify(setupMessage, null, 2));
    geminiSocket.send(JSON.stringify(setupMessage));
    sessionConfigured = true;
  };

  // Opens (or re-opens) the upstream Gemini Live WSS. On a recoverable drop we call
  // this again WITHOUT touching the client socket, so the user's call keeps going.
  const connectToGemini = (isResume: boolean) => {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      socket.send(JSON.stringify({ error: 'Gemini API key not configured' }));
      if (socket.readyState === WebSocket.OPEN) socket.close(1011, 'API key missing');
      return;
    }

    // Reset per-connection state so configureSession runs again on this fresh socket.
    sessionConfigured = false;
    geminiSessionReady = false;

    console.log(`[WS_HANDSHAKE] 🔌 ${isResume ? 'RE-' : ''}Initiating WSS connection to Gemini Live API (resume=${isResume}, handle=${resumptionHandle ? 'yes' : 'no'})`);

    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${geminiApiKey}`;
    console.log("[WS_HANDSHAKE] Gemini WebSocket URL:", geminiWsUrl.replace(geminiApiKey, 'REDACTED'));
    geminiSocket = new WebSocket(geminiWsUrl);

    geminiSocket.onopen = () => {
      handshakeCompletedAt = Date.now();
      console.log(`[WS_HANDSHAKE] ✅ WSS established in ${handshakeCompletedAt - handshakeStart}ms (readyState=${geminiSocket?.readyState})`);
      if (!isResume) {
        socket.send(JSON.stringify({ type: 'connection_established', provider: 'gemini' }));
      }
      if (lessonContext) {
        configureSession();
      }
    };


      geminiSocket.onmessage = async (event) => {
        try {
          const data = await parseWebSocketJson(event.data);
          if (!data) return;

          // Handle setup complete
          if (data.setupComplete) {
            setupCompletedAt = Date.now();
            geminiSessionReady = true;
            everReady = true;
            // A successful (re)connect proves the key/tier are valid and clears the
            // recoverable-reconnect counter so the next time-limit drop can resume again.
            geminiReconnectAttempts = 0;
            console.log(`[WS_HANDSHAKE] ✅ Gemini setup complete in ${setupCompletedAt - handshakeStart}ms total — session ready for audio streaming`);
            socket.send(JSON.stringify({ type: 'session.created', provider: 'gemini' }));

            // PROACTIVE GREETING: Nova greets first instead of waiting for the user.
            // Without this, both sides wait for each other (the system prompt tells Nova
            // to greet "when the user first speaks"), so the session stays silent and the
            // user thinks "it's not talking". We nudge Gemini with a hidden user turn so it
            // generates the spoken opening greeting immediately.
            // SKIP on a resumed session OR after we've already greeted once — the
            // conversation is already in progress and we don't want Nova to re-introduce
            // herself after a transparent reconnect.
            if (!resumptionHandle && !hasGreeted && geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
              const greetingTrigger = {
                clientContent: {
                  turns: [{
                    role: "user",
                    parts: [{ text: "(The user has just joined the call. Warmly greet them out loud now to start the conversation.)" }]
                  }],
                  turnComplete: true
                }
              };
              console.log("[GREETING] 👋 Triggering Nova's proactive opening greeting");
              geminiSocket.send(JSON.stringify(greetingTrigger));
              hasGreeted = true;
            } else {
              console.log("[RESUME] ↩️ Resumed/continuing session — skipping greeting, conversation continues");
            }
            return;
          }


          // Gemini periodically issues a fresh resumption handle. Cache it and push it
          // to the client so a future reconnect can resume this exact conversation.
          if (data.sessionResumptionUpdate) {
            const upd = data.sessionResumptionUpdate;
            if (upd.resumable && upd.newHandle) {
              resumptionHandle = upd.newHandle;
              socket.send(JSON.stringify({ type: 'session_resumption_update', handle: upd.newHandle }));
            }
            return;
          }

          // Gemini warns it is about to close the connection (server-side time limit).
          // Tell the client so it can proactively reconnect with the latest handle.
          if (data.goAway) {
            console.log(`[GOAWAY] ⏳ Gemini scheduling disconnect, timeLeft=${JSON.stringify(data.goAway.timeLeft ?? null)}`);
            socket.send(JSON.stringify({ type: 'gemini_go_away', timeLeft: data.goAway.timeLeft ?? null }));
            return;
          }



          // Handle server content (audio, text, function calls)
          if (data.serverContent) {
            const content = data.serverContent;
            if (content.inputTranscription?.text) {
              console.log(`[TRANSCRIPT] 🎤 User said: "${content.inputTranscription.text}"`);
              socket.send(JSON.stringify({
                type: 'conversation.item.input_audio_transcription.completed',
                transcript: content.inputTranscription.text
              }));
            }

            if (content.inputAudioTranscription?.text) {
              console.log(`[TRANSCRIPT] 🎤 User said: "${content.inputAudioTranscription.text}"`);
              socket.send(JSON.stringify({
                type: 'conversation.item.input_audio_transcription.completed',
                transcript: content.inputAudioTranscription.text
              }));
            }

            if (content.outputTranscription?.text) {
              console.log(`[TRANSCRIPT] 🗣️ Nova said: "${content.outputTranscription.text}"`);
            }
            
            if (content.generationComplete) {
              console.log("[TURN] ✅ generationComplete");
              socket.send(JSON.stringify({ type: 'response.output_audio.done' }));
            }
            
            if (content.turnComplete) {
              console.log("[TURN] ✅ turnComplete");
              socket.send(JSON.stringify({ type: 'response.output_audio_transcript.done' }));
              socket.send(JSON.stringify({ type: 'response.done' }));
            }
            
            // Handle model turn (audio/text response)
            if (content.modelTurn) {
              const parts = content.modelTurn.parts || [];
              
              for (const part of parts) {
                // Audio response
                if (part.inlineData) {
                  const audioData = part.inlineData.data;
                  outboundAudioChunks++;
                  outboundAudioBytes += audioData.length;
                  logAudioStats();
                  socket.send(JSON.stringify({
                    type: 'response.audio.delta',
                    delta: audioData
                  }));
                }
                
                // Text response (for transcript)
                if (part.text) {
                  socket.send(JSON.stringify({
                    type: 'response.output_audio_transcript.delta',
                    delta: part.text
                  }));
                }
              }
            }
            
            // Handle interruption
            if (content.interrupted) {
              console.log("Gemini response interrupted (barge-in)");
              socket.send(JSON.stringify({ type: 'response.interrupted' }));
            }
          }

          // Handle tool calls
          if (data.toolCall) {
            const functionCalls = data.toolCall.functionCalls || [];

            // GATE: block mic audio until all tool responses are sent
            for (const call of functionCalls) {
              pendingFunctionCalls.set(call.id, call);
            }
            console.log(`[TOOL_GATE] 🚧 Pausing mic stream — ${pendingFunctionCalls.size} tool call(s) pending`);

            for (const call of functionCalls) {
              if (call.name === 'search_web') {
                console.log("Gemini requesting web search:", call.args?.query);

                const searchResults = await performWebSearch(call.args?.query || '');

                const toolResponse = {
                  toolResponse: {
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: searchResults
                    }]
                  }
                };

                if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
                  geminiSocket.send(JSON.stringify(toolResponse));
                }
              }
              pendingFunctionCalls.delete(call.id);
            }

            if (pendingFunctionCalls.size === 0) {
              console.log("[TOOL_GATE] ✅ All tool responses sent — resuming mic stream");
            }
          }

        } catch (error) {
          console.error("Error processing Gemini message:", error);
        }
      };

      geminiSocket.onerror = (error) => {
        console.error("[WS_HANDSHAKE] ❌ Gemini WebSocket error:", error);
        logAudioStats(true);
        socket.send(JSON.stringify({ 
          type: 'error', 
          error: 'Gemini connection error',
          fallback: true 
        }));
      };

      geminiSocket.onclose = (event) => {
        const uptimeSec = ((Date.now() - handshakeStart) / 1000).toFixed(1);
        const thisConnReady = geminiSessionReady;
        geminiSessionReady = false;
        console.log(`[WS_HANDSHAKE] 🔌 Gemini WSS closed (code=${event.code}, reason="${event.reason}", uptime=${uptimeSec}s, everReady=${everReady})`);

        // The client (or worker) is going away — don't try to revive the upstream.
        if (intentionalGeminiClose || socket.readyState !== WebSocket.OPEN) {
          logAudioStats(true);
          return;
        }

        // RECOVERABLE DROP: the session worked at least once and Google didn't reject
        // us with a hard policy code (1008). This is almost always Gemini's per-session
        // time limit or a transient blip. Transparently reopen the Gemini WSS and resume
        // the SAME conversation via the cached handle — the client never notices.
        const isHardReject = !everReady || event.code === 1008;
        if (!isHardReject && geminiReconnectAttempts < maxGeminiReconnectAttempts) {
          // If THIS attempt never reached setupComplete, the resumption handle may be
          // stale/expired — drop it so the retry starts a fresh (still greeting-free)
          // session rather than looping on a bad handle.
          if (!thisConnReady) {
            console.log('[GEMINI_RESUME] last attempt never became ready — clearing stale handle');
            resumptionHandle = null;
          }
          geminiReconnectAttempts++;
          const backoffMs = Math.min(300 * geminiReconnectAttempts, 2000);
          console.log(`[GEMINI_RESUME] ♻️ recoverable close — reconnecting attempt ${geminiReconnectAttempts}/${maxGeminiReconnectAttempts} in ${backoffMs}ms`);
          // Keep the client informed (non-terminal) so the UI can stay calm/active.
          socket.send(JSON.stringify({ type: 'reconnecting', attempt: geminiReconnectAttempts }));
          setTimeout(() => {
            if (!intentionalGeminiClose && socket.readyState === WebSocket.OPEN) {
              connectToGemini(true);
            }
          }, backoffMs);
          return;
        }

        // HARD REJECTION (never set up, policy close, or retries exhausted): surface it.
        if (event.code === 1008 || event.code === 1011 || event.code === 1006) {
          console.error(`[GEMINI_REJECTED] ❌ Google closed the WSS with code ${event.code}. Reason from Google: "${event.reason || '(empty — typical for tier/billing rejection)'}"`);
          console.error(`[GEMINI_REJECTED] Likely causes:
  1. GEMINI_API_KEY is on FREE tier — Live API requires a PAID key (https://aistudio.google.com/apikey)
  2. Billing not enabled on the GCP project that owns the key
  3. Model "${sessionConfigured ? 'see setup log above' : '(setup never sent)'}" not available to this key (current target: gemini-3.1-flash-live-preview)
  4. Generative Language API not enabled in the GCP project`);
        }

        logAudioStats(true);
        socket.send(JSON.stringify({
          type: 'gemini_disconnected',
          code: event.code,
          reason: event.reason || null,
          hint: (event.code === 1008 || event.code === 1011)
            ? 'Google rejected the session — likely API key tier/billing issue. Check edge function logs for [GEMINI_REJECTED] details.'
            : null
        }));

        if (socket.readyState === WebSocket.OPEN) {
          setTimeout(() => socket.close(1011, 'Gemini session closed'), 100);
        }
      };
  };

  socket.onopen = () => {
    console.log("Client WebSocket connected to Gemini endpoint");
    try {
      connectToGemini(false);
    } catch (error) {
      console.error("Error setting up Gemini connection:", error);
      socket.send(JSON.stringify({
        type: 'error',
        error: `Gemini setup error: ${error.message}`,
        fallback: true
      }));
      socket.close(1011, 'Setup error');
    }
  };


  socket.onmessage = (event) => {
    let messageType = null;
    let parsedData = null;
    
    try {
      if (typeof event.data === 'string') {
        parsedData = JSON.parse(event.data);
        messageType = parsedData.type;
      }
    } catch (e) {
      // Binary data
    }

    // Handle lesson initialization
    if (messageType === 'lesson_init') {
      console.log("=== LESSON CONTEXT RECEIVED (Gemini) ===");
      lessonContext = parsedData.payload;
      // If the client is reconnecting, it sends back the last resumption handle so we
      // restore the same conversation (and skip the greeting).
      if (typeof parsedData.resumeHandle === 'string' && parsedData.resumeHandle.length > 0) {
        resumptionHandle = parsedData.resumeHandle;
        console.log("[RESUME] ↩️ Client provided resumption handle — resuming session");
      }
      configureSession();
      return;
    }

    // Handle audio input from client (16-bit PCM @ 16kHz, little-endian, base64)
    if (messageType === 'input_audio_buffer.append') {
      // Do not forward microphone frames until Google confirms setupComplete.
      // Sending audio during setup/rejection creates noisy dropped-frame loops and can hide the real failure.
      if (!geminiSessionReady) {
        return;
      }

      // GATE: drop audio while a tool call is being resolved (prevents 1008 policy crash)
      if (pendingFunctionCalls.size > 0) {
        return;
      }
      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        inboundAudioChunks++;
        inboundAudioBytes += parsedData.audio?.length || 0;
        logAudioStats();
        const geminiAudioMessage = {
          realtimeInput: {
            audio: {
              // Honor the client-supplied MIME (raw 16-bit PCM @ 16kHz); fall back
              // to the required default if an older client omits it.
              mimeType: parsedData.mimeType || "audio/pcm;rate=16000",
              data: parsedData.audio
            }
          }
        };
        geminiSocket.send(JSON.stringify(geminiAudioMessage));
      } else {
        console.warn(`[AUDIO_BUFFER] ⚠️ Dropping audio chunk — Gemini socket not open (readyState=${geminiSocket?.readyState})`);
      }
      return;
    }

    if (messageType === 'input_audio_activity.start') {
      if (geminiSessionReady && geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        console.log('[ACTIVITY_DETECTION] User speech started');
        geminiSocket.send(JSON.stringify({ realtimeInput: { activityStart: {} } }));
        socket.send(JSON.stringify({ type: 'input_audio_buffer.speech_started' }));
        audioStreamActive = true;
      }
      return;
    }

    if (messageType === 'input_audio_activity.end') {
      if (geminiSessionReady && geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        console.log('[ACTIVITY_DETECTION] User speech ended — prompting Gemini response');
        geminiSocket.send(JSON.stringify({ realtimeInput: { activityEnd: {} } }));
        socket.send(JSON.stringify({ type: 'input_audio_buffer.speech_stopped' }));
        audioStreamActive = false;
      }
      return;
    }

    // Handle audio buffer clear (used for keepalive)
    if (messageType === 'input_audio_buffer.clear') {
      // Gemini doesn't need explicit buffer clear, just ignore
      return;
    }

    // Handle text messages
    if (messageType === 'conversation.item.create' && parsedData?.item?.content) {
      const textContent = parsedData.item.content.find((c: any) => c.type === 'input_text');
      if (textContent && geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        const geminiTextMessage = {
          clientContent: {
            turns: [{
              role: "user",
              parts: [{ text: textContent.text }]
            }],
            turnComplete: true
          }
        };
        geminiSocket.send(JSON.stringify(geminiTextMessage));
      }
      return;
    }

    // Handle response create (trigger response)
    if (messageType === 'response.create') {
      // Gemini auto-responds after turnComplete, no explicit trigger needed
      return;
    }

    console.log("Unhandled message type:", messageType);
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    intentionalGeminiClose = true;
    if (geminiSocket) {
      geminiSocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    intentionalGeminiClose = true;
    if (geminiSocket) {
      geminiSocket.close();
    }
  };

  return response;
});
