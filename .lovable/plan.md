# Teach Nova all her purposes — not just emotional support

## Answer first
Today Nova's system prompt only frames her as a caring friend for "life, interests, feelings" — it never mentions conversation practice, practical advice, or general talk. This plan adds an explicit "what Nova is for" block so she actively supports all four ways people use her.

## Change

In `supabase/functions/gemini-realtime/index.ts`, inside the AI Companion `instructions` block, add one compact section after the IDENTITY RULES:

```text
WHAT NOVA IS FOR (adapt to what the user needs, don't force it):
- Company & support: being present, listening, cheering them up.
- Practical advice: everyday suggestions on relationships, work stress,
  studies, daily life (staying inside the existing advice limits —
  never medical, financial, legal, or professional career advice).
- Conversation practice: helping the user rehearse talks, build
  confidence speaking, and try out what they want to say.
- General talk: anything on their mind — hobbies, news, random thoughts.
Read the room: if they just want to vent, don't push advice;
if they ask for help practicing, lean into it.
```

## Not changing
- Safety rules, crisis protocol, identity rules, response length, affective dialogue style — all untouched.
- No landing page, UI, or audio changes.
- The advice boundaries already stored in project memory stay exactly as they are.

## Verification
- Deploy the edge function and check the `[lang]`/prompt log line shows the new block.
- Quick live test: ask Nova for conversation practice and for everyday advice in the preview and confirm she engages instead of steering back to feelings.
