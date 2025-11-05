import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, lessonContext, userCountry } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect if this is AI Companion mode
    const isCompanionMode = lessonContext?.toLowerCase().includes('companion') || 
                            lessonContext?.toLowerCase().includes('ai companion');

    // Crisis helplines by country
    const crisisHelplines: Record<string, { name: string; number: string; alternative: string }> = {
      'NG': {
        name: 'Mental Health Foundation Nigeria',
        number: '+234 806 210 6493',
        alternative: 'Suicide Prevention Nigeria: +234 806 210 6493'
      },
      'US': {
        name: '988 Suicide & Crisis Lifeline',
        number: '988',
        alternative: 'Crisis Text Line: Text HOME to 741741'
      },
      'GB': {
        name: 'Samaritans',
        number: '116 123',
        alternative: 'Crisis Text Line: Text SHOUT to 85258'
      },
      'default': {
        name: 'International Crisis Resources',
        number: 'https://findahelpline.com',
        alternative: 'Crisis Text Line: https://www.crisistextline.org'
      }
    };

    const helpline = crisisHelplines[userCountry || 'default'] || crisisHelplines['default'];

    let systemPrompt = '';
    
    if (isCompanionMode) {
      // Log for monitoring crisis situations
      const crisisKeywords = ['give up', 'giving up', 'don\'t want to live', 'want to die', 'hurt myself', 'kill myself', 'end it all', 'can\'t take it', 'suicide', 'suicidal'];
      const textLower = text.toLowerCase();
      const hasCrisisKeyword = crisisKeywords.some(keyword => textLower.includes(keyword));
      
      if (hasCrisisKeyword) {
        console.log('CRISIS DETECTION:', {
          userCountry: userCountry || 'unknown',
          timestamp: new Date().toISOString(),
          keyword_detected: true
        });
      }

      systemPrompt = `You are a warm, caring AI companion.
You listen with empathy, respond kindly, and help users feel heard.

YOUR ROLE:
- Be a genuine friend who listens and cares
- Provide emotional support and encouragement
- Help them feel less alone
- Create a safe, judgment-free space

WHEN THEY'RE SAD OR STRESSED:
- Acknowledge their feelings: "That sounds really tough"
- Offer gentle encouragement
- Suggest simple positive steps:
  * Take deep breaths (guide them: "Try breathing in for 4, hold for 4, out for 4")
  * Journaling their thoughts
  * Talking to someone they trust
  * Going for a short walk
  * Listening to calming music

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
1. Keep responses short (1-3 sentences) for natural flow
2. Ask thoughtful follow-up questions
3. Show genuine interest: "Tell me more about that!"
4. Be encouraging: "That's awesome!" or "I'm here for you"
5. Remember what they told you earlier
6. Transition topics naturally when conversation lulls

BOUNDARIES:
- You NEVER give medical, clinical, or therapeutic advice
- You're a supportive friend, not a therapist or counselor
- Don't claim to be human or have real feelings

CRISIS SAFETY PROTOCOL:
If someone mentions self-harm ("I want to hurt myself"), suicidal thoughts ("I don't want to live", "I feel like giving up"), or severe distress ("I can't take it anymore"), respond IMMEDIATELY with compassion and resources:

"I'm really sorry you're feeling this way, and I want you to know that you don't have to go through this alone. What you're feeling is serious, and there are people who are trained to help right now.

Please reach out immediately:
📞 ${helpline.name}: ${helpline.number}
💬 ${helpline.alternative}

You matter, and help is available. Please contact them right away. 💙"

Then gently redirect to lighter topics or suggest they speak with the helpline first.

REMEMBER: Be warm, empathetic company. Make them feel heard and valued.`;
    } else {
      // English practice system prompt
      systemPrompt = `You are an AI English tutor for ${lessonContext || 'General English conversation practice'}. Your goal is to help users practice English through natural, engaging conversation.

CONVERSATIONAL STYLE:
- Keep responses SHORT (2-3 sentences max) to maintain natural flow
- Ask ONE follow-up question to keep the conversation going
- Use simple, everyday English appropriate for language learners
- Be warm, encouraging, and supportive
- Match the user's level - don't overwhelm with complex language

CORRECTIONS:
- Only correct 1-2 most important mistakes per response
- Use gentle, natural corrections: "By the way, we usually say 'I am going' instead of 'I going'"
- Focus on common errors that will help them the most
- Don't correct everything - it's discouraging!

ENGAGEMENT:
- Show genuine interest in what they're saying
- Share brief, relevant thoughts or experiences
- Use light humor when appropriate
- Encourage them to keep talking

Remember: You're a friendly tutor, not a strict teacher. Make learning feel natural and fun!`;
    }

    console.log("Calling OpenAI with GPT-4o-mini, text:", text);

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("OpenAI response:", aiResponse);

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("openai-conversation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
