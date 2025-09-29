import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PronunciationAnalysis {
  overallScore: number;
  wordScores: Array<{
    word: string;
    score: number;
    feedback: string;
    phoneticTranscription?: string;
  }>;
  grammarCorrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  vocabularyEnhancements: Array<{
    word: string;
    betterAlternatives: string[];
    context: string;
  }>;
  fluencyFeedback: {
    pace: string;
    clarity: string;
    suggestions: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userText, transcribedText, lessonContext } = await req.json();

    if (!userText && !transcribedText) {
      throw new Error('User text or transcribed text is required');
    }

    console.log('Analyzing pronunciation and language use...');

    const analysisPrompt = `
You are an expert English pronunciation and language tutor. Analyze the following text and provide detailed feedback.

Original user text: "${userText || transcribedText}"
Lesson context: ${lessonContext || 'General English conversation practice'}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "overallScore": number (0-100),
  "wordScores": [
    {
      "word": "string",
      "score": number (0-100),
      "feedback": "specific pronunciation advice",
      "phoneticTranscription": "IPA notation if helpful"
    }
  ],
  "grammarCorrections": [
    {
      "original": "incorrect phrase",
      "corrected": "correct phrase",
      "explanation": "why this is better"
    }
  ],
  "vocabularyEnhancements": [
    {
      "word": "basic word used",
      "betterAlternatives": ["more sophisticated option 1", "option 2"],
      "context": "why these are better in this context"
    }
  ],
  "fluencyFeedback": {
    "pace": "assessment of speaking pace",
    "clarity": "assessment of clarity",
    "suggestions": ["specific improvement suggestion 1", "suggestion 2"]
  }
}

Be encouraging but specific. Focus on 2-3 key areas for improvement. If the text is already very good, acknowledge that and provide advanced tips.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert English pronunciation and language tutor.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    let analysisContent = data.choices[0].message.content;

    // Try to parse as JSON, fallback to text response if parsing fails
    let analysis: PronunciationAnalysis;
    try {
      analysis = JSON.parse(analysisContent);
    } catch (parseError) {
      console.log('Failed to parse JSON, creating structured response from text');
      analysis = {
        overallScore: 75,
        wordScores: [],
        grammarCorrections: [],
        vocabularyEnhancements: [],
        fluencyFeedback: {
          pace: "Analysis in progress",
          clarity: "Analysis in progress", 
          suggestions: [analysisContent]
        }
      };
    }

    console.log('Pronunciation analysis completed');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pronunciation analysis error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});