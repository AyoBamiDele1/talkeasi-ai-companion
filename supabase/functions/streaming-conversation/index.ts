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

    console.log('Processing streaming conversation for:', lessonContext);

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

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start AI conversation with streaming
          const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              stream: true,
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`OpenAI API error: ${aiResponse.status}`);
          }

          const reader = aiResponse.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          let fullResponse = '';
          let currentSentence = '';
          let sentenceCount = 0;

          const textDecoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // Process final sentence if any
              if (currentSentence.trim()) {
                await processAndStreamSentence(currentSentence, controller, sentenceCount++);
              }
              
              // Send final response data
              let parsedResponse;
              try {
                parsedResponse = JSON.parse(fullResponse);
              } catch {
                parsedResponse = {
                  response: fullResponse,
                  corrections: [],
                  feedback: null
                };
              }

              controller.enqueue(`data: ${JSON.stringify({
                type: 'conversation_complete',
                data: parsedResponse
              })}\n\n`);
              
              controller.close();
              break;
            }

            const chunk = textDecoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    currentSentence += content;

                    // Check if we have a complete sentence (ends with . ! ?)
                    if (/[.!?]\s*$/.test(currentSentence.trim()) && currentSentence.trim().length > 10) {
                      await processAndStreamSentence(currentSentence, controller, sentenceCount++);
                      currentSentence = '';
                    }

                    // Send text chunk immediately
                    controller.enqueue(`data: ${JSON.stringify({
                      type: 'text_chunk',
                      chunk: content
                    })}\n\n`);
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Streaming conversation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processAndStreamSentence(sentence: string, controller: ReadableStreamDefaultController, index: number) {
  try {
    console.log(`Processing sentence ${index}: ${sentence.substring(0, 50)}...`);
    
    // Generate TTS for this sentence in parallel
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: sentence.trim(),
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });

    if (ttsResponse.ok) {
      const arrayBuffer = await ttsResponse.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      // Stream the audio chunk
      controller.enqueue(`data: ${JSON.stringify({
        type: 'audio_chunk',
        audio: base64Audio,
        index: index,
        text: sentence.trim()
      })}\n\n`);
    } else {
      console.error('TTS failed for sentence:', sentence);
    }
  } catch (error) {
    console.error('Error processing sentence:', error);
  }
}