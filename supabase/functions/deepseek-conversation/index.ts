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

  try {
    const { text, lessonContext, conversationHistory } = await req.json();
    console.log('[DeepSeek Conversation] Processing text:', text);

    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      console.error('[DeepSeek Conversation] API key not configured');
      return new Response(
        JSON.stringify({ error: 'DeepSeek API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation context
    const systemPrompt = `You are an experienced English tutor helping a student practice speaking English.

Context: ${lessonContext || 'General English conversation practice'}

Guidelines:
- Keep responses concise (1-2 sentences) for natural conversation flow
- Focus on the current topic
- Provide gentle corrections when needed
- Ask follow-up questions to encourage more speaking
- Be encouraging and supportive
- Use natural, conversational language

IMPORTANT: Keep your response short and conversational, like a real tutor would speak.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: text }
    ];

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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DeepSeek Conversation] API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('[DeepSeek Conversation] No response from API');
      return new Response(
        JSON.stringify({ error: 'No response from DeepSeek API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[DeepSeek Conversation] Response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DeepSeek Conversation] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
