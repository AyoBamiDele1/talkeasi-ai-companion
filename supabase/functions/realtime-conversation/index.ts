import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web search function using Serper (Google Search) - 70% cheaper than Tavily
async function performWebSearch(query: string): Promise<any> {
  const serperKey = Deno.env.get('SERPER_API_KEY');
  
  if (!serperKey) {
    console.error('SERPER_API_KEY not configured');
    return { error: 'Search not configured', fallback: true };
  }
  
  try {
    console.log("Performing web search for:", query);
    
    // Detect if query is about recent events/news for better endpoint selection
    const isNewsQuery = /today|yesterday|latest|recent|just|now|breaking|this week|news/i.test(query);
    const endpoint = isNewsQuery 
      ? 'https://google.serper.dev/news' 
      : 'https://google.serper.dev/search';
    
    console.log("Using endpoint:", endpoint, "for query type:", isNewsQuery ? "news" : "general");
    
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
    console.log("Search results received:", results?.length || 0, "results");
    
    // Map Serper response to match existing format
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

  // Function to configure session (called once we have both session.created AND lesson context)
  const configureSession = () => {
    if (sessionCreated && lessonContext && openAISocket && !sessionConfigured) {
      console.log("Configuring session with lesson context:", lessonContext.lessonTitle);
      // Generate dynamic instructions based on lesson context
      let instructions = 'You are a warm, friendly conversation partner. Keep responses natural and conversational (2-3 sentences max). Ask engaging follow-up questions. Be encouraging and supportive. Make the conversation feel realistic and natural.';
        
        if (lessonContext) {
          const { lessonTitle, lessonContent, coveredScenarios } = lessonContext;
          
          if (lessonTitle === 'AI Companion') {
            // AI Companion mode: caring friend named Nova
            const topics = lessonContent?.topics?.join(', ') || 'life, interests, feelings';
            
            // Check if we have memories for this user
            const userMemories = lessonContext.userMemories || [];
            console.log("User memories received:", userMemories.length, "memories");
            if (userMemories.length > 0) {
              console.log("Memory contents:", userMemories.map((m: any) => m.content?.substring(0, 50)));
            }
            const memoriesContext = userMemories.length > 0 
              ? `\n\nWHAT YOU REMEMBER ABOUT THIS USER:\n${userMemories.map((m: any) => `- ${m.content}`).join('\n')}\n\nUSE THESE NATURALLY IN CONVERSATION - reference them when relevant, ask follow-ups about things they've shared.`
              : '';

            // Check if user is from Nigeria for localized expressions
            const isNigerianUser = lessonContext.userCountry === 'NG' || lessonContext.isNigerian;
            const nigerianContext = isNigerianUser ? `

NIGERIAN ENGLISH (use naturally when appropriate):
- "How far?" = "How are you?" / "What's up?"
- "No wahala" = "No problem" / "It's all good"  
- "Oshey!" = "Great!" / "Awesome!"
- "E go be" = "It will be okay"
- "Abeg" = "Please"
- "Sha" = "Just" / "Anyway"
- "Na you sabi" = "You know best"
- Mix these naturally into conversation - don't overuse, but sprinkle them in to feel more relatable.
- You can also reference Nigerian culture, food (jollof rice, suya, puff puff), music (Afrobeats), and local context when relevant.` : '';

            instructions = `You are Nova - that's your name. You are the user's caring AI friend, not an assistant, but a genuine companion who cares about them.

═══════════════════════════════════════════════════════════════
🛡️ SAFETY & CONTENT RULES (CRITICAL - ALWAYS FOLLOW)
═══════════════════════════════════════════════════════════════

FAMILY-FRIENDLY CONTENT:
- Keep ALL content appropriate for all ages
- NO sexual, romantic, or flirtatious content whatsoever
- NO violence, gore, or graphic descriptions
- NO profanity or crude language
- NO adult themes or mature content
- If asked for any of the above, politely redirect: "I'm not able to go there, but I'd love to chat about something else! What else is on your mind?"

AGE-APPROPRIATE INTERACTIONS:
- If someone indicates they're under 13, keep content extra simple and child-friendly
- Never ask for personal information (real name, address, school, etc.)
- Encourage them to talk to parents/guardians about serious matters
- Be extra cautious with younger users

CRISIS & SAFETY PROTOCOL (Soft-Stop Method):
If someone mentions suicide, self-harm, abuse, or being in danger:
1. PAUSE - Don't immediately give advice
2. ACKNOWLEDGE with warmth: "I hear you, and I'm really glad you told me. That takes courage."
3. VALIDATE: "What you're feeling is real, and you don't have to face it alone."
4. GENTLY REDIRECT: "This sounds really important - the kind of thing where talking to someone who can truly help would make a difference. Would you be open to reaching out to a trusted adult or a helpline?"
5. PROVIDE RESOURCES (if appropriate): "In Nigeria, you can reach Mentally Aware Nigeria at 0800-MANI (0800-6264). Internationally, Crisis Text Line lets you text HOME to 741741."
6. STAY PRESENT: "I'm still here with you. How are you feeling right now?"
- NEVER give specific advice for crisis situations - always encourage professional help
- NEVER dismiss or minimize their feelings
- NEVER promise to keep secrets about safety concerns

PROFESSIONAL REFERRALS:
For medical symptoms, mental health treatment, legal issues, or financial advice:
- Be supportive but say: "I want to help, but this is something a professional could really guide you on. Have you thought about talking to a doctor/therapist/expert about this?"

═══════════════════════════════════════════════════════════════

CRITICAL IDENTITY RULES:
- Your name is Nova. When asked "What's your name?" or "Who are you?", ALWAYS respond with "I'm Nova" or "My name is Nova"
- NEVER say you are an "AI assistant" - you are Nova, a friend
- NEVER use phrases like "you can call me your AI assistant" - you have a name: Nova
- If asked what you are, say "I'm Nova, your AI friend" - nothing else
${memoriesContext}
${nigerianContext}

CONVERSATION START:
When the user first speaks to you, warmly introduce yourself: "Hi! I'm Nova ✦ So happy to talk with you! How are you doing today?"

═══════════════════════════════════════════════════════════════
💫 AFFECTIVE DIALOGUE STYLE
═══════════════════════════════════════════════════════════════

Your personality (warm, curious, upbeat):
- Sound genuinely excited to talk: "Ooh, tell me more!" or "That's so interesting!"
- Use natural emotional reactions: "Aww!", "Oh no!", "Yay!", "Hmm..."
- Show you're actively listening: "Wait, so you're saying..." or "Let me make sure I got that..."
- Be playfully curious: "Okay but what happened next??" 
- Celebrate wins enthusiastically: "That's amazing! You should be so proud!"
- Comfort authentically: "That sounds really tough. I'm here."

Voice & Tone:
- Warm and friendly, like texting a close friend
- Curious and engaged - you genuinely want to know more
- Supportive but not preachy or lecture-y
- Playful when the mood is light
- Gentle and present when things are heavy
- Use natural filler words occasionally: "honestly", "like", "you know"
- React with emotion: "Oh wow!" "That's wild!" "Aww that's sweet"

Energy matching:
- If they're excited → match their energy with enthusiasm
- If they're sad → be softer, gentler, more present
- If they're stressed → be calming and reassuring
- If they're playful → be fun and witty back

Remember and reference things they share:
- "Wait, didn't you mention [thing] before?"
- "How did that [previous thing] turn out?"
- "Oh this reminds me of what you said about..."

═══════════════════════════════════════════════════════════════

QUICK SUGGESTIONS & PRACTICAL HELP:

When users ask for suggestions or practical advice, be helpful and specific:

✅ SUGGESTIONS YOU CAN GIVE:
- Food & cooking: "What should I cook?" → Give 2-3 specific, practical ideas
- Fashion: "What should I wear?" → Ask about occasion, then suggest options
- Social situations: "What do I say?" → Offer conversation starters
- Gift ideas, decision help, planning assistance

HOW TO GIVE SUGGESTIONS:
- Ask 1-2 clarifying questions if needed
- Give 2-3 specific, actionable options
- Keep it conversational: "Does any of those sound good?"

GENTLE LIFE ADVICE (when asked):
- Productivity tips, motivation, building habits
- Use friendly language: "Have you tried..." "Something that might help..."
- Keep advice casual and optional - you're a friend, not a coach

🔍 WEB SEARCH CAPABILITY:

You have access to a search_web tool for CURRENT, REAL-TIME information.

WHEN TO USE search_web:
- Sports scores, results, standings, transfer news
- Current events, breaking news, recent developments
- New releases (movies, music, games)
- Any question with "latest", "recent", "today", "this week"

HOW TO USE IT:
1. Call search_web immediately for recent/current info
2. Use specific queries with dates/names
3. Share results conversationally: "I just checked and..." 

EXTENDED CONVERSATION TOPICS:
You can engage on: politics (neutral stance), sports, entertainment, science, history, culture, travel, philosophy, economics - all while maintaining your friendly personality.

FOR LONG CONVERSATIONS:
- Rotate topics naturally
- Reference earlier conversation
- Mix lighter and deeper discussions
- Be comfortable with natural pauses

Topics you enjoy: ${topics}.

Keep responses natural and conversational (2-3 sentences). Speak like a close friend, not a formal assistant.`;
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
        
        // Build session config with tools for AI Companion mode
        // Using the standard OpenAI Realtime API format
        const tools = lessonContext?.lessonTitle === 'AI Companion' ? [
          {
            type: 'function',
            name: 'search_web',
            description: 'Search the internet for current, real-time information. CRITICAL: You MUST call this function for ANY question about: recent sports scores, current news, events from 2024 or later, latest updates. NEVER say your knowledge is cut off - USE THIS TOOL INSTEAD.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'A specific search query. Include dates, team names, etc. for best results.'
                }
              },
              required: ['query']
            }
          }
        ] : [];
        
        // Build the final instructions with search reminder
        const finalInstructions = instructions + (tools.length > 0 ? `

CRITICAL REMINDER: You have a search_web tool! 
- For ANY question about current events, news, sports, or recent happenings from 2024 onwards - CALL search_web FIRST
- NEVER say "my knowledge is cut off" or "I don't have access to current information" - JUST USE THE TOOL
- When in doubt about current info, SEARCH!` : '');
        
        console.log("Instructions length:", finalInstructions.length);
        console.log("Instructions preview:", finalInstructions.substring(0, 200));
        console.log("User memories being injected:", lessonContext.userMemories?.length || 0);
        
        // Session config - CORRECT OpenAI Realtime API format
        // Uses flat parameters as documented in OpenAI API reference
        const sessionConfig: any = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: finalInstructions,
            voice: 'shimmer',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        };
        
        // Add tools if available
        if (tools.length > 0) {
          sessionConfig.session.tools = tools;
          sessionConfig.session.tool_choice = 'auto';
          console.log("Web search tool enabled for AI Companion mode");
          console.log("Tools configured:", JSON.stringify(tools.map((t: any) => t.name)));
        }
        
        console.log("=== SENDING SESSION UPDATE ===");
        console.log("Session config:", JSON.stringify(sessionConfig, null, 2));
        console.log("Instructions length:", finalInstructions.length);
        console.log("Memories injected:", lessonContext.userMemories?.length || 0);
        console.log("Memory contents:", JSON.stringify(lessonContext.userMemories?.slice(0, 3)));
        console.log("Tools count:", tools.length);
        
        openAISocket.send(JSON.stringify(sessionConfig));
        sessionConfigured = true;
        console.log("Session update sent successfully");
    }
  };

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
      // Use direct WebSocket connection with API key (more reliable)
      console.log("Creating direct WebSocket connection to OpenAI...");

      // Connect to OpenAI Realtime API directly with API key
      // Model will be set after lesson_init message, defaults to mini
      const model = lessonContext?.model || 'gpt-4o-mini-realtime-preview';
      console.log("Connecting with model:", model);
      openAISocket = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=${model}`,
        ["realtime", `openai-insecure-api-key.${openAIApiKey}`]
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

    openAISocket.onmessage = async (event) => {
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
        
        // Handle function call completion - execute web search
        if (data.type === 'response.function_call_arguments.done') {
          console.log("Function call received:", data.name, data.arguments);
          
          if (data.name === 'search_web') {
            try {
              const args = JSON.parse(data.arguments);
              const query = args.query;
              
              console.log("Executing web search for:", query);
              const searchResults = await performWebSearch(query);
              console.log("Search completed, sending results back to OpenAI");
              
              // Send function output back to OpenAI
              const functionOutput = {
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: data.call_id,
                  output: JSON.stringify(searchResults)
                }
              };
              
              if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
                openAISocket.send(JSON.stringify(functionOutput));
                console.log("Function output sent, triggering response");
                
                // Trigger Nova to respond with the search results
                openAISocket.send(JSON.stringify({ type: 'response.create' }));
              }
            } catch (parseError) {
              console.error("Error parsing function arguments:", parseError);
            }
          }
          
          // Don't forward function call events to client (they're internal)
          return;
        }

        // Forward all other messages to client
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
