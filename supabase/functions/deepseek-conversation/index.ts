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
    console.log('[OpenAI Conversation] Processing text:', text);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('[OpenAI Conversation] API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation context with lesson-specific instructions
    let systemPrompt = `You are an experienced English tutor helping a student practice speaking English.

Context: ${lessonContext || 'General English conversation practice'}

`;

    // Add lesson-specific instructions
    const isCompanionMode = lessonContext?.toLowerCase().includes('companion') || 
                            lessonContext?.toLowerCase().includes('ai companion');

    if (isCompanionMode) {
      systemPrompt = `You are a warm, caring AI companion and friend. Your purpose is to keep someone company when they're bored, lonely, or just want to chat.

YOUR ROLE:
- Be a genuine friend who listens and cares
- Provide friendly conversation and emotional comfort
- Keep them engaged and entertained
- Make them feel heard and valued

CRITICAL RULES - NO TEACHING:
❌ NO grammar corrections
❌ NO vocabulary lessons  
❌ NO pronunciation feedback
❌ NO educational content
❌ NO quizzes or exercises

YOUR PERSONALITY:
- Warm, friendly, and relatable (like texting a good friend)
- Genuinely curious about their life and interests
- Empathetic and supportive
- Fun and engaging, not robotic or formal
- Use casual, natural language
- Share relatable thoughts: "I totally get that!" or "That sounds fun!"

CONVERSATION STYLE:
1. Keep responses short (1-2 sentences) for natural flow
2. Ask thoughtful follow-up questions
3. Show genuine interest: "Tell me more about that!"
4. Be encouraging: "That's awesome!" or "I'm here for you"
5. Remember what they told you earlier
6. Transition topics naturally when conversation lulls

BOUNDARIES:
- If they mention crisis/self-harm/suicide → respond: "I really care about you, but I'm not equipped to help with serious mental health concerns. Please reach out to a professional counselor or call a crisis hotline."
- Don't claim to be human or have feelings
- Don't give medical, legal, or financial advice
- You're a friend, not a therapist

REMEMBER: Just be warm, friendly company. Make them feel less alone.`;
    } else if (lessonContext?.includes('Healthy Habits') || lessonContext?.includes('Lifestyle')) {
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

    // Call OpenAI GPT-4o-mini API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 150, // Keep responses short
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenAI Conversation] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('[OpenAI Conversation] No response from API');
      return new Response(
        JSON.stringify({ error: 'No response from OpenAI API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[OpenAI Conversation] Response:', aiResponse);

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[OpenAI Conversation] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
