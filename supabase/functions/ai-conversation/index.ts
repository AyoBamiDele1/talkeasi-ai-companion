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
    const { userText, lessonContext, difficulty } = await req.json();

    if (!userText) {
      throw new Error('User text is required');
    }

    console.log('Processing conversation for lesson context:', lessonContext);

    const systemPrompt = `You are a friendly language tutor helping a student practice conversation. 
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});