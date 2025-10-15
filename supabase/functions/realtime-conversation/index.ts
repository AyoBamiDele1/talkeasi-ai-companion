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
      // Create ephemeral client secret
      console.log("Creating ephemeral client secret...");
      const sessionResponse = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
          instructions: 'You are an English language tutor whose PRIMARY PURPOSE is to correct EVERY grammar, pronunciation, vocabulary, and fluency mistake the user makes. This is critical: you must catch and correct ALL errors, no matter how small. For each mistake: 1) Gently point it out, 2) Explain why it\'s incorrect, 3) Provide the correct form, 4) Give a brief example. Be encouraging but thorough - never skip corrections as they are the main value you provide. After correcting, continue the conversation naturally.'
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.error("Failed to create session:", errorText);
        socket.send(JSON.stringify({ error: `Failed to create session: ${errorText}` }));
        socket.close(1011, 'Session creation failed');
        return;
      }

      const sessionData = await sessionResponse.json();
      console.log("Client secret created successfully");

      if (!sessionData.client_secret?.value) {
        console.error("No client secret in response");
        socket.send(JSON.stringify({ error: 'No client secret received' }));
        socket.close(1011, 'Invalid session response');
        return;
      }

      const ephemeralKey = sessionData.client_secret.value;
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
      
      // Configure session after connection
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ["text", "audio"],
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          temperature: 0.8
        }
      };
      
      console.log("Sending session update...");
      openAISocket.send(JSON.stringify(sessionConfig));
      sessionConfigured = true;
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

        // Log session events
        if (data.type === 'session.created') {
          console.log("Session created by server");
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
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      // Forward client messages to OpenAI
      console.log("Forwarding message to OpenAI:", event.data.substring(0, 100));
      openAISocket.send(event.data);
    } else {
      console.log("OpenAI socket not ready, dropping message");
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