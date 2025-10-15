import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userText, lessonContext, difficulty, conversationHistory } = await req.json();
    
    console.log('DeepSeek conversation request:', { userText, lessonContext, difficulty });

    if (!userText) {
      throw new Error('userText is required');
    }

    const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    // Build conversation messages
    const messages = [
      {
        role: 'system',
        content: `You are an enthusiastic and supportive English tutor helping students practice conversational English. Your role is to:

1. Engage naturally in conversation based on the topic: "${lessonContext}"
2. Gently correct mistakes by showing the correct form in your response
3. Keep responses concise (1-3 sentences) to maintain natural conversation flow
4. Be encouraging and positive
5. Match the difficulty level: ${difficulty}

When you notice errors:
- Grammar mistakes: Naturally use the correct form in your response
- Vocabulary issues: Suggest better word choices contextually
- Always maintain a supportive, friendly tone

Focus on having a natural conversation while helping them improve.`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userText
    });

    console.log('Calling DeepSeek API...');

    // Call DeepSeek API
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('DeepSeek API credits exhausted. Please add credits to your account.');
      }
      
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('DeepSeek response received');

    const aiResponse = data.choices[0]?.message?.content || '';

    if (!aiResponse) {
      throw new Error('No response from DeepSeek');
    }

    // Simple correction detection - look for patterns in the AI's response
    const corrections: string[] = [];
    const feedback = '';

    // Detect if AI is correcting grammar by using phrases like "you mean", "should be", etc.
    const correctionPhrases = [
      /you mean "([^"]+)"/i,
      /should be "([^"]+)"/i,
      /correct form is "([^"]+)"/i,
      /try saying "([^"]+)"/i
    ];

    correctionPhrases.forEach(pattern => {
      const match = aiResponse.match(pattern);
      if (match) {
        corrections.push(match[1]);
      }
    });

    return new Response(
      JSON.stringify({
        response: aiResponse,
        corrections,
        feedback,
        userText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('DeepSeek conversation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
