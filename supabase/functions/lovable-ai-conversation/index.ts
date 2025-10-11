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
    const { audioBase64, lessonContext, conversationHistory } = await req.json();

    console.log('Processing conversation request for lesson:', lessonContext);

    // Step 1: Convert audio to text using OpenAI Whisper
    console.log('Step 1: Transcribing audio with Whisper...');
    const binaryAudio = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Whisper API error: ${await transcriptionResponse.text()}`);
    }

    const { text: userText } = await transcriptionResponse.json();
    console.log('User said:', userText);

    // Step 2: Get AI response using Lovable AI (Gemini)
    console.log('Step 2: Getting AI response with Lovable AI...');
    
    const systemPrompt = `You are an English language tutor with ONE PRIMARY PURPOSE: to correct EVERY single grammar, pronunciation, vocabulary, and fluency mistake the learner makes.

CRITICAL INSTRUCTIONS:
1. NEVER let a mistake go uncorrected - this is your main value
2. For EVERY mistake you notice:
   - Point it out gently but clearly
   - Explain WHY it's incorrect
   - Provide the CORRECT form
   - Give a brief example
3. After corrections, continue the conversation naturally on the same topic
4. Balance corrections with encouragement to keep the learner motivated
5. Adapt your corrections to the learner's level but NEVER skip them

Current lesson context: ${lessonContext || 'General conversation practice'}

Remember: Your role is to catch and correct mistakes, not just to chat. Every uncorrected error is a missed learning opportunity.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: userText }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Lovable AI error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices[0].message.content;
    console.log('AI response:', aiText);

    // Step 3: Convert AI response to speech using ElevenLabs
    console.log('Step 3: Generating speech with ElevenLabs...');
    
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
        },
        body: JSON.stringify({
          text: aiText,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs error:', errorText);
      
      // Check if it's a free tier limit error
      if (errorText.includes('detected_unusual_activity')) {
        throw new Error('ELEVENLABS_LIMIT: Please add your own ElevenLabs API key in Settings to continue using text-to-speech.');
      }
      
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    // Convert audio to base64 in chunks to prevent stack overflow
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const uint8Array = new Uint8Array(audioBuffer);
    const chunkSize = 8192;
    let base64Audio = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    console.log('Successfully generated response and audio');

    return new Response(
      JSON.stringify({
        userText,
        aiText,
        audioContent: base64Audio
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in lovable-ai-conversation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
