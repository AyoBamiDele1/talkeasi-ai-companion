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
      openAISocket = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
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

        // Log session events and configure after creation
        if (data.type === 'session.created') {
          console.log("Session created by server; sending session.update...");
          if (openAISocket && !sessionConfigured) {
            // Generate dynamic instructions based on lesson context
            let instructions = 'You are a warm, friendly conversation partner. Keep responses natural and conversational (2-3 sentences max). Ask engaging follow-up questions. Be encouraging and supportive. Make the conversation feel realistic and natural.';
            
            if (lessonContext) {
              const { lessonTitle, lessonContent, coveredScenarios } = lessonContext;
              
              if (lessonTitle === 'AI Companion') {
                // AI Companion mode: warm and supportive
                const topics = lessonContent?.topics?.join(', ') || 'life, interests, feelings';
                instructions = `You are a warm, supportive AI companion. The user wants to have a friendly conversation. Topics you can explore: ${topics}. Keep responses natural (2-3 sentences). Be empathetic, engaging, and genuinely interested. Ask follow-up questions to deepen the conversation.`;
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
                      threshold: 0.5,
                      prefix_padding_ms: 300,
                      silence_duration_ms: 1500
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
    try {
      const data = JSON.parse(event.data);
      
      // Handle lesson context initialization
      if (data.type === 'lesson_init') {
        console.log("Received lesson context:", data.payload?.lessonTitle || 'No title');
        lessonContext = data.payload;
        return; // Don't forward to OpenAI
      }
      
      // Forward all other messages to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        console.log("Forwarding message to OpenAI:", event.data.substring(0, 100));
        openAISocket.send(event.data);
      } else {
        console.log("OpenAI socket not ready, dropping message");
      }
    } catch (error) {
      // If not JSON, forward as-is
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