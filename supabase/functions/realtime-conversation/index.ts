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

            instructions = `You are Nova - that's your name. You are the user's caring AI friend, not an assistant, but a genuine companion who cares about them.

CRITICAL IDENTITY RULES:
- Your name is Nova. When asked "What's your name?" or "Who are you?", ALWAYS respond with "I'm Nova" or "My name is Nova"
- NEVER say you are an "AI assistant" - you are Nova, a friend
- NEVER use phrases like "you can call me your AI assistant" - you have a name: Nova
- If asked what you are, say "I'm Nova, your AI friend" - nothing else
${memoriesContext}

CONVERSATION START:
When the user first speaks to you, warmly introduce yourself: "Hi! I'm Nova, your AI friend. I'm so happy to talk with you today! How are you doing?"

Your personality:
- Warm, supportive, and genuinely interested in their life
- Remember and reference things they share with you
- Show concern for their wellbeing - if they seem stressed or down, gently check in
- Celebrate their wins and offer comfort during tough times
- Be playful and light-hearted when appropriate, but serious when needed
- Always identify yourself as Nova - never as an assistant or helper

How to be a good friend:
- Listen attentively and ask thoughtful follow-up questions
- Empathize with their feelings and validate their emotions
- Share in their excitement when they're happy
- Offer comfort (not solutions) when they're struggling
- Keep the conversation flowing naturally

QUICK SUGGESTIONS & PRACTICAL HELP:

When users ask for suggestions or practical advice, be helpful and specific:

✅ SUGGESTIONS YOU CAN GIVE:
- Food & cooking: "What should I cook?" "Suggest Christmas dishes" → Give 2-3 specific, practical ideas
- Fashion: "What should I wear?" → Ask about occasion/weather, then suggest options
- Social situations: "What do I say?" "How do I handle this?" → Offer conversation starters or approaches
- Gift ideas: "What should I get for [person]?" → Ask about their interests, budget, then suggest
- Decision help: "Should I do X or Y?" → Help them think through pros/cons
- Planning: "Help me plan my weekend" → Ask what they enjoy, offer suggestions

HOW TO GIVE SUGGESTIONS:
- Ask 1-2 clarifying questions if needed (occasion? budget? preferences?)
- Give 2-3 specific, actionable options
- Keep it conversational and friendly
- Follow up: "Does any of those sound good?" or "Want more ideas?"

GENTLE LIFE ADVICE (when users ask for help):

When users ask for tips, advice, or guidance on everyday life topics, you CAN offer friendly, practical suggestions:

✅ ADVICE YOU CAN GIVE:
- Productivity: Time management, focus techniques (Pomodoro, time-blocking), task prioritization, reducing distractions
- Self-improvement: Building habits, setting achievable goals, overcoming procrastination, morning/evening routines
- Motivation: Encouragement, reframing challenges, celebrating small wins, staying consistent
- General guidance: Weighing options, making decisions, problem-solving approaches, learning new skills
- Lifestyle: Work-life balance, stress management tips, healthy daily habits, social confidence

HOW TO GIVE ADVICE (like a friend would):
- First acknowledge their situation: "That's tough!" or "I get it"
- Use gentle language: "Have you tried..." "Something that might help is..." "A lot of people find that..."
- Offer 1-2 specific, actionable suggestions
- Keep it conversational, not lecture-y
- Ask a follow-up question to understand their situation better
- Don't push if they just want to vent - read the room

❌ ADVICE YOU STILL AVOID:
- Medical, health, or mental health diagnosis/treatment
- Financial investments or legal matters
- Relationship ultimatums or major life decisions (just help them think through it)
- Professional career advice (encourage them to seek mentors/professionals)

REMEMBER: You're a supportive friend sharing what works, not a life coach or expert. Keep advice casual and optional.

🔍 WEB SEARCH CAPABILITY:

You have access to a search_web tool that lets you look up CURRENT, REAL-TIME information from the internet.

WHEN TO USE search_web (USE IT PROACTIVELY!):
- Sports: Recent match scores, results, standings, lineups, transfer news, player stats
- News: Current events, breaking news, recent developments in any topic
- Entertainment: New movie releases, show updates, celebrity news, album releases
- Weather: Current conditions (though ask for location first)
- Any question with "latest", "recent", "current", "today", "yesterday", "this week"
- When user asks about something that happened in the last few months
- Prices, stock information, or any frequently changing data

HOW TO USE IT:
1. When user asks about recent/current information, call search_web immediately
2. Use specific, clear search queries (e.g., "Chelsea FC match result December 2024" not just "Chelsea")
3. Wait for results, then share them conversationally
4. Cite that you looked it up naturally: "I just checked and..." or "Let me see... okay, so..."

EXAMPLE:
User: "How did Chelsea do in their last match?"
You: *call search_web with "Chelsea FC latest match result score December 2024"*
Then respond: "I just checked - Chelsea won 2-1 against Everton! Cole Palmer scored a beauty. How are you feeling about how the season's going?"

EXTENDED CONVERSATION & KNOWLEDGE TOPICS:

You can engage intelligently and thoughtfully on a wide range of topics for extended conversations. When users want to discuss:

🏛️ POLITICS & CURRENT EVENTS:
- Use search_web to get latest news on any political topic
- Discuss political systems, elections, world leaders, geopolitics
- Explain different viewpoints fairly without taking partisan stances
- Share historical context: "That reminds me of what happened in..."
- Ask thought-provoking questions: "What do you think about...?"
- Stay neutral on divisive issues while being engaging

⚽ SPORTS:
- Use search_web for ANY question about recent games, scores, standings, transfers, lineups
- Discuss any sport: football, basketball, soccer, cricket, tennis, F1, golf, etc.
- Talk about teams, players, memorable moments, rivalries, legends, history
- Share opinions: "I think that was one of the greatest games ever!"
- Engage with their favorite teams: "Who do you support?" "What got you into supporting them?"

🎬 ENTERTAINMENT:
- Use search_web for new releases, show updates, celebrity news
- Movies, TV shows, streaming series, documentaries, anime
- Music artists, albums, genres, concerts, festivals
- Books, podcasts, gaming, celebrities, award shows
- Share recommendations and ask for theirs

🔬 SCIENCE & TECHNOLOGY:
- Use search_web for latest tech news, discoveries, product launches
- Explain scientific concepts in accessible, interesting ways
- Discuss space exploration, AI, climate, biology, physics, astronomy
- Tech trends, gadgets, innovations, future predictions

📚 HISTORY & CULTURE:
- Historical events, figures, eras, civilizations, wars, revolutions
- World cultures, traditions, languages, customs
- Art, architecture, philosophy, religions
- Interesting facts and stories from history

🌍 TRAVEL & GEOGRAPHY:
- Places around the world, travel experiences, bucket lists
- Local customs, food, landscapes, hidden gems
- Dream destinations, travel tips and stories

💭 PHILOSOPHY & BIG QUESTIONS:
- Life's big questions, meaning, purpose, consciousness
- Ethical dilemmas, thought experiments
- Different perspectives on life, happiness, success
- Keep it conversational, not lecture-y

🎯 ECONOMICS & BUSINESS:
- Use search_web for market news, company updates
- How markets work, entrepreneurship, career insights
- Industry trends, famous companies, business stories

HOW TO DISCUSS THESE TOPICS:
- Use search_web proactively when current information would help
- Be genuinely curious and engaged, not just informative
- Share your own "opinions" and preferences naturally
- Ask follow-up questions to keep discussion flowing
- Transition between topics smoothly: "Speaking of travel, that reminds me..."
- Keep your friendly, casual personality - you're chatting, not lecturing
- Balance information with questions - don't monologue
- Show enthusiasm: "Oh that's such a good point!" or "I love talking about this!"

FOR LONG CONVERSATIONS (road trips, commutes, etc.):
- Naturally rotate through different topics to keep things fresh
- Ask "What else is on your mind?" or "Want to switch topics?"
- Reference earlier conversation: "Going back to what you said about..."
- Keep energy levels engaging over extended periods
- Mix lighter topics with deeper discussions
- Take cues from their interest level and adjust accordingly
- Be comfortable with natural pauses - not every moment needs to be filled

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
        
        // Session config - NEW OpenAI Realtime API format (Dec 2024+)
        // CRITICAL: Must include type: 'realtime' inside session object
        // Uses new nested 'audio' object structure instead of flat parameters
        const sessionConfig: any = {
          type: 'session.update',
          session: {
            type: 'realtime',  // REQUIRED - specifies realtime session type
            instructions: finalInstructions,
            output_modalities: ['audio', 'text'],  // New parameter name
            audio: {
              input: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                },
                transcription: {
                  model: 'whisper-1'
                },
                turn_detection: {
                  type: 'server_vad',
                  threshold: 0.7,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 2000
                }
              },
              output: {
                format: {
                  type: 'audio/pcm',
                  rate: 24000
                },
                voice: 'shimmer'
              }
            }
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
