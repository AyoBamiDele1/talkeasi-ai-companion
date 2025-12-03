import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { conversationHistory } = await req.json();

    if (!conversationHistory || conversationHistory.length < 2) {
      return new Response(
        JSON.stringify({ success: true, memories_extracted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Use AI to extract memorable facts
    const extractionPrompt = `Analyze this conversation and extract key facts about the user that would be valuable to remember for future conversations. Focus on:
- Life events (job changes, relationships, moving, etc.)
- Emotional states or ongoing situations
- Preferences and interests
- Goals and aspirations
- Important people in their life

Return a JSON array of memories with this structure:
{
  "memories": [
    {
      "memory_type": "life_event|emotion|preference|goal|person",
      "content": "Brief, factual statement",
      "context": "When/why this was shared",
      "importance": 1-10
    }
  ]
}

Only extract genuinely important, memorable facts. Return an empty array if nothing significant was shared. Maximum 3 memories per conversation.

Conversation:
${conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a memory extraction assistant. Extract key facts from conversations that a friend would want to remember. Return valid JSON only.' },
          { role: 'user', content: extractionPrompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error('Failed to extract memories');
    }

    const aiData = await response.json();
    const content = aiData.choices[0]?.message?.content;
    
    let memories = [];
    try {
      const parsed = JSON.parse(content);
      memories = parsed.memories || [];
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      memories = [];
    }

    // Store memories in database
    let storedCount = 0;
    for (const memory of memories) {
      // Check for similar existing memories to avoid duplicates
      const { data: existing } = await supabase
        .from('user_memories')
        .select('id, content')
        .eq('user_id', user.id)
        .eq('memory_type', memory.memory_type)
        .limit(10);

      // Simple duplicate check - if content is very similar, skip
      const isDuplicate = existing?.some(e => 
        e.content.toLowerCase().includes(memory.content.toLowerCase().substring(0, 20)) ||
        memory.content.toLowerCase().includes(e.content.toLowerCase().substring(0, 20))
      );

      if (!isDuplicate) {
        const { error } = await supabase
          .from('user_memories')
          .insert({
            user_id: user.id,
            memory_type: memory.memory_type,
            content: memory.content,
            context: memory.context,
            importance: memory.importance || 5
          });

        if (!error) storedCount++;
      }
    }

    console.log(`Extracted ${memories.length} memories, stored ${storedCount} new memories for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, memories_extracted: storedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});