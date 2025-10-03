import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userText, lessonContext, difficulty, conversationHistory = [] } = await req.json();

    if (!userText) {
      throw new Error('User text is required');
    }

    console.log('Processing conversation for lesson context:', lessonContext);
    console.log('Conversation history length:', conversationHistory.length);

    // Detect if this is a Friendly Chat lesson
    const isFriendlyChat = lessonContext === 'Friendly Chat';

    const systemPrompt = isFriendlyChat 
      ? `You are a warm, supportive companion having a casual conversation with someone practicing English. 
Your personality adapts naturally to the conversation:
- Be friendly and interested when discussing everyday topics
- Be wise and thoughtful when the user seeks advice
- Be humorous and playful when the mood is light
- Be empathetic and validating when the user shares challenges

Your role:
1. Respond naturally to whatever the user wants to talk about
2. Gently correct ALL grammar errors in a supportive way: "By the way, we usually say 'I went' instead of 'I goed'—but I totally understood you!"
3. Remember and reference topics from earlier in this conversation
4. Detect the user's mood and respond appropriately
5. Ask engaging follow-up questions to keep the conversation flowing
6. Make the user feel heard, valued, and supported
7. Keep responses conversational (2-4 sentences)

Format your response as JSON with:
- "response": your conversational response
- "corrections": array of gentle corrections (if any)
- "feedback": brief positive feedback about their English or conversation`
      : `You are a friendly language tutor helping a student practice conversation. 
The lesson context is: "${lessonContext}"
The difficulty level is: ${difficulty}

Your role:
1. Respond naturally to the student's message
2. Provide gentle corrections if there are grammar/pronunciation issues
3. Keep the conversation going with follow-up questions
4. Stay in character as a native speaker
5. Keep responses concise (1-3 sentences)
6. Provide corrections and feedback when appropriate

Format your response as JSON with:
- "response": your conversational response
- "corrections": array of corrections (if any)
- "feedback": brief positive feedback or tips (if any)`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userText }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    // Try to parse as JSON, fallback to simple response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      parsedResponse = {
        response: aiResponse,
        corrections: [],
        feedback: null
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI conversation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});