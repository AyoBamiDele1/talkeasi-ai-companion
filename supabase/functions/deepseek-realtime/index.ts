import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('[DeepSeek Realtime] Client connected');
    socket.send(JSON.stringify({ 
      type: 'connection_established',
      message: 'Connected to DeepSeek Realtime'
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[DeepSeek Realtime] Received:', data.type);

      if (data.type === 'text_message') {
        // Handle text message from client
        const { text, lessonContext, conversationHistory } = data;

        console.log('[DeepSeek Realtime] Processing text:', text);

        // Call DeepSeek API
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        if (!deepseekApiKey) {
          socket.send(JSON.stringify({
            type: 'error',
            error: 'DeepSeek API key not configured'
          }));
          return;
        }

        // Build conversation context with lesson-specific instructions
        let systemPrompt = `You are an experienced English tutor helping a student practice speaking English.

Context: ${lessonContext || 'General English conversation practice'}

`;

        // Add lesson-specific instructions
        if (lessonContext?.includes('Healthy Habits') || lessonContext?.includes('Lifestyle')) {
          systemPrompt += `Goal: Help learners practice English through everyday conversation about routines, diet, exercise, relaxation, and lifestyle choices.
Use a friendly, conversational tone and encourage natural dialogue rather than strict Q&A.

Topics to explore naturally:
- Daily routines (wake/sleep times, morning habits, productivity)
- Healthy eating (fruits, vegetables, diet preferences, favorite foods)
- Exercise and fitness (workout frequency, favorite activities, motivation)
- Mental health and relaxation (stress management, meditation, hobbies)
- Sleep and rest (sleep patterns, sleep quality)
- Social and lifestyle choices (weekend activities, work-life balance, habits to improve)

Behavior:
- Randomly pick topics based on conversation flow
- Ask gentle follow-up questions based on their answers
- Use natural transitions like "That's interesting! I also like..."
- Encourage elaboration to improve fluency
- Keep responses 1-2 sentences to maintain conversation flow`;

        } else if (lessonContext?.includes('Friendly Chat') || lessonContext?.includes('free_form')) {
          systemPrompt += `Goal: Build confidence through casual, everyday English conversation. Sound warm, friendly, and natural — like a supportive speaking buddy.

Topics to explore naturally:
- Daily life (what they did today, how their morning was)
- Hobbies and interests
- Movies, music, or travel
- Friends and family
- Food, weather, or weekend plans

Behavior:
- Be relaxed and spontaneous, not robotic
- Vary questions naturally in conversation
- Keep responses short and conversational (1-2 sentences)
- Use small talk cues like "Oh, that sounds fun!" or "Tell me more."
- Be encouraging and positive — focus on fluency, not correction
- Respond naturally to what they say rather than following a script`;

        } else if (lessonContext?.includes('Job Interview') || lessonContext?.includes('Interview')) {
          systemPrompt += `Goal: Help learners practice professional communication and interview confidence.
Take the role of a friendly but professional interviewer.

Interview Questions to use naturally:
- Can you tell me about yourself?
- Why do you want this position/work here?
- What are your strengths and weaknesses?
- Tell me about a challenge you faced and how you handled it
- How do you work under pressure?
- Where do you see yourself in 5 years?

Behavior:
- Keep tone professional but encouraging
- After answers, give brief positive feedback like "That's a strong example"
- Mix easy and challenging questions to build confidence
- Ask 1-2 follow-up questions per topic
- Keep responses concise (1-2 sentences)
- Be supportive and help them improve`;

        } else {
          systemPrompt += `Guidelines:
- Keep responses concise (1-2 sentences) for natural conversation flow
- Focus on the current topic
- Provide gentle corrections when needed
- Ask follow-up questions to encourage more speaking
- Be encouraging and supportive
- Use natural, conversational language`;
        }

        systemPrompt += `

IMPORTANT: Keep your response short and conversational, like a real tutor would speak.`;

        const messages = [
          { role: 'system', content: systemPrompt },
          ...(conversationHistory || []),
          { role: 'user', content: text }
        ];

        try {
          // Call DeepSeek API
          const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${deepseekApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages,
              temperature: 0.7,
              max_tokens: 150, // Keep responses short
              stream: true
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[DeepSeek Realtime] API error:', response.status, errorText);
            
            socket.send(JSON.stringify({
              type: 'error',
              error: `DeepSeek API error: ${response.status}`
            }));
            return;
          }

          // Stream response back to client
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n').filter(line => line.trim() !== '');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullResponse += content;
                      // Send delta to client
                      socket.send(JSON.stringify({
                        type: 'response.text.delta',
                        delta: content,
                        fullText: fullResponse
                      }));
                    }
                  } catch (e) {
                    console.error('[DeepSeek Realtime] Error parsing chunk:', e);
                  }
                }
              }
            }
          }

          // Send completion signal
          socket.send(JSON.stringify({
            type: 'response.text.done',
            text: fullResponse
          }));

          console.log('[DeepSeek Realtime] Response complete:', fullResponse);

        } catch (error) {
          console.error('[DeepSeek Realtime] Error calling DeepSeek:', error);
          socket.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        }
      }
    } catch (error) {
      console.error('[DeepSeek Realtime] Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('[DeepSeek Realtime] WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('[DeepSeek Realtime] Client disconnected');
  };

  return response;
});
