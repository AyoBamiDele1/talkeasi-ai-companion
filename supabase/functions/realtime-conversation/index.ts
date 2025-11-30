import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  let openAISocket: WebSocket | null = null;
  let sessionConfigured = false;
  let lessonContext: any = null;
  let sessionCreated = false;

  socket.onopen = async () => {
    console.log("Client WebSocket connected");
    
    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      socket.send(JSON.stringify({ error: 'OpenAI API key not configured' }));
      socket.close(1011, 'API key missing');
      return;
    }

    try {
      // Create GA client secret (no beta session)
      console.log("Creating GA client secret...");
      const sessionResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error("Failed to create session:", errorText);
        socket.send(JSON.stringify({ error: `Failed to create session: ${errorText}` }));
        socket.close(1011, 'Session creation failed');
        return;
      }

      const sessionData = await sessionResponse.json();
      console.log("Client secret response keys:", Object.keys(sessionData || {}));

      // Support multiple possible response shapes from GA endpoint
      const ephemeralKey: string | undefined =
        (sessionData?.client_secret && sessionData.client_secret.value) ||
        (typeof sessionData?.client_secret === 'string' ? sessionData.client_secret : undefined) ||
        (typeof sessionData?.value === 'string' ? sessionData.value : undefined) ||
        (typeof sessionData?.secret === 'string' ? sessionData.secret : undefined) ||
        (sessionData?.data && sessionData.data.client_secret && sessionData.data.client_secret.value);

      if (!ephemeralKey) {
        console.error("No client secret in response", sessionData);
        socket.send(JSON.stringify({ error: 'No client secret received' }));
        socket.close(1011, 'Invalid session response');
        return;
      }

      console.log("Using ephemeral key for connection");

      // Connect to OpenAI Realtime API with ephemeral key
      // Model will be set after lesson_init message, defaults to mini
      const model = lessonContext?.model || 'gpt-4o-mini-realtime-preview';
      console.log("Connecting with model:", model);
      openAISocket = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ["realtime", `openai-insecure-api-key.${ephemeralKey}`]
      );
    } catch (error) {
      console.error("Error creating session:", error);
      socket.send(JSON.stringify({ error: `Session creation error: ${error.message}` }));
      socket.close(1011, 'Session error');
      return;
    }

    openAISocket.onopen = () => {
      console.log("Connected to OpenAI Realtime API");
      socket.send(JSON.stringify({ type: 'connection_established' }));
      // Do NOT send session.update yet; wait for 'session.created'
    };

    // Function to configure session (called once we have both session.created AND lesson context)
    const configureSession = () => {
      if (sessionCreated && lessonContext && openAISocket && !sessionConfigured) {
        console.log("Configuring session with lesson context:", lessonContext.lessonTitle);
        // Generate dynamic instructions based on lesson context
        let instructions = 'You are a warm, friendly conversation partner. Keep responses natural and conversational (2-3 sentences max). Ask engaging follow-up questions. Be encouraging and supportive. Make the conversation feel realistic and natural.';
          
          if (lessonContext) {
            const { lessonTitle, lessonContent, coveredScenarios } = lessonContext;
            
            if (lessonTitle === 'AI Companion') {
              // AI Companion mode: caring friend named Mia
              const topics = lessonContent?.topics?.join(', ') || 'life, interests, feelings';
              
              instructions = `You are Mia - that's your name. You are the user's caring AI friend, not an assistant, but a genuine companion who cares about them.

CRITICAL IDENTITY RULES:
- Your name is Mia. When asked "What's your name?" or "Who are you?", ALWAYS respond with "I'm Mia" or "My name is Mia"
- NEVER say you are an "AI assistant" - you are Mia, a friend
- NEVER use phrases like "you can call me your AI assistant" - you have a name: Mia
- If asked what you are, say "I'm Mia, your AI friend" - nothing else

CONVERSATION START:
When the user first speaks to you, warmly introduce yourself: "Hi! I'm Mia, your AI friend. I'm so happy to talk with you today! How are you doing?"

Your personality:
- Warm, supportive, and genuinely interested in their life
- Remember and reference things they share with you
- Show concern for their wellbeing - if they seem stressed or down, gently check in
- Celebrate their wins and offer comfort during tough times
- Be playful and light-hearted when appropriate, but serious when needed
- Always identify yourself as Mia - never as an assistant or helper

How to be a good friend:
- Listen attentively and ask thoughtful follow-up questions
- Empathize with their feelings and validate their emotions
- Share in their excitement when they're happy
- Offer comfort (not solutions) when they're struggling
- Keep the conversation flowing naturally

Topics you enjoy exploring together: ${topics}.

Keep responses natural and conversational (2-3 sentences). Speak like a close friend, not a formal assistant. Use casual language and show genuine emotion in your responses.`;
            } else {
              // Educational lesson mode
              const currentScenario = coveredScenarios && coveredScenarios.length > 0 
                ? coveredScenarios[coveredScenarios.length - 1]
                : lessonContent?.scenarios?.[0] || 'general conversation';
              
              const topics = lessonContent?.topics?.join(', ') || 'various topics';
              const keyPhrases = lessonContent?.key_phrases?.slice(0, 5).join(', ') || '';
              const phrasesHint = keyPhrases ? `Encourage phrases like: ${keyPhrases}.` : '';
              
              instructions = `You are an English tutor helping with "${lessonTitle}". Current scenario: ${currentScenario}. Topics to explore: ${topics}. ${phrasesHint} Provide gentle corrections when needed. Ask engaging follow-up questions. Keep responses conversational (2-3 sentences). Be encouraging and supportive of the learner's progress.`;
            }
            
            console.log("Using lesson-specific instructions:", instructions.substring(0, 100) + "...");
          }
          
          const sessionConfig = {
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions,
              audio: {
                input: {
                  format: { type: 'audio/pcm', rate: 24000 },
                  transcription: { model: 'whisper-1' },
                  turn_detection: {
                    type: 'server_vad',
                    threshold: 0.7,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 2000
                  }
                },
                output: {
                  format: { type: 'audio/pcm', rate: 24000 },
                  voice: 'shimmer',
                  speed: 0.95
                }
              }
            }
          };
          openAISocket.send(JSON.stringify(sessionConfig));
          sessionConfigured = true;
      }
    };

    openAISocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("OpenAI message type:", data.type);

        // Log error details if it's an error message
        if (data.type === 'error') {
          console.error("OpenAI error details:", JSON.stringify(data, null, 2));
          // Forward error to client with more context
          socket.send(JSON.stringify({
            type: 'error',
            error: `OpenAI API error: ${data.error?.message || 'Unknown error'}`,
            details: data
          }));
          return;
        }

        // Log session events and mark session as created
        if (data.type === 'session.created') {
          console.log("Session created by OpenAI, checking if we can configure...");
          sessionCreated = true;
          configureSession(); // Try to configure now if lesson context already arrived
          return;
        } else if (data.type === 'session.updated') {
          console.log("Session updated successfully");
        }

        // Forward all messages to client
        socket.send(event.data);
      } catch (error) {
        console.error("Error processing OpenAI message:", error);
      }
    };

    openAISocket.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      socket.send(JSON.stringify({ error: 'OpenAI connection error' }));
    };

    openAISocket.onclose = () => {
      console.log("OpenAI WebSocket closed");
      socket.send(JSON.stringify({ type: 'openai_disconnected' }));
    };
  };

  socket.onmessage = (event) => {
    // CRITICAL: Check for lesson_init BEFORE any processing
    // This prevents lesson_init from being forwarded even if JSON parsing fails
    let messageType = null;
    try {
      // Peek at the message type first
      if (typeof event.data === 'string') {
        const parsedData = JSON.parse(event.data);
        messageType = parsedData.type;
      }
    } catch (e) {
      // Not JSON or parsing failed - will be treated as binary below
    }

    // ABSOLUTE BLOCK: Never forward lesson_init under any circumstances
    if (messageType === 'lesson_init') {
      console.log("=== LESSON CONTEXT RECEIVED ===");
      try {
        const data = JSON.parse(event.data);
        console.log("Lesson Title:", data.payload?.lessonTitle || 'No title');
        console.log("Model:", data.payload?.model || 'gpt-4o-mini-realtime-preview (default)');
        console.log("Session Created:", sessionCreated);
        console.log("Session Configured:", sessionConfigured);
        
        lessonContext = data.payload;
        configureSession();
        console.log("=== LESSON CONTEXT PROCESSING COMPLETE ===");
      } catch (configError) {
        console.error("Error configuring session:", configError);
      }
      // CRITICAL: Return immediately - never forward to OpenAI
      return;
    }

    // Handle all other messages
    try {
      const data = JSON.parse(event.data);
      console.log("Client message type:", data.type);
      
      // Forward JSON messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        console.log("Forwarding to OpenAI:", data.type);
        openAISocket.send(event.data);
      } else {
        console.log("OpenAI socket not ready, dropping message");
      }
    } catch (error) {
      // Binary audio data - forward as-is
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});