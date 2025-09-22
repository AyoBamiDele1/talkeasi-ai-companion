-- Update existing lessons with rich multimedia content

-- Update Business Introduction lesson with audio and images
UPDATE lessons 
SET content = '{
  "scenarios": ["Restaurant orders", "Menu discussions", "Payment and tips"],
  "key_phrases": ["I''d like to order...", "Could I have the menu please?", "The bill, please"],
  "audio_content": [
    {
      "src": "https://www.soundjay.com/misc/sounds/business-intro.mp3",
      "title": "Professional Introduction Example",
      "description": "Listen to how a professional introduces themselves in a business setting",
      "type": "example",
      "transcription": "Good morning, my name is Sarah Johnson and I''m the Marketing Director at TechCorp Nigeria. It''s a pleasure to meet you."
    },
    {
      "src": "https://www.soundjay.com/misc/sounds/pronunciation.mp3", 
      "title": "Key Phrases Pronunciation",
      "description": "Practice pronouncing important business phrases",
      "type": "pronunciation",
      "transcription": "I''d like to introduce myself... My role involves... I look forward to working with you..."
    }
  ],
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600",
      "alt": "Business meeting handshake",
      "title": "Professional Business Meeting",
      "description": "Common scenarios for business introductions",
      "type": "scenario",
      "caption": "Professional introductions often happen during meetings and networking events"
    }
  ],
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "What is the most appropriate way to introduce yourself in a business setting?",
      "options": [
        "Hi, I''m John",
        "Good morning, my name is John Smith and I''m the Sales Manager at ABC Company",
        "Hey there, John here!",
        "John Smith, nice to meet you"
      ],
      "correct": 1,
      "explanation": "A formal introduction should include your full name, your position, and your company name."
    },
    {
      "type": "fill-blank",
      "sentence": "Good morning, my name is ___ and I work as a ___ at ___.",
      "blanks": [
        {"answer": "John Smith", "alternatives": ["Sarah Johnson", "Mary Williams"]},
        {"answer": "Manager", "alternatives": ["Director", "Supervisor", "Coordinator"]},
        {"answer": "TechCorp", "alternatives": ["ABC Company", "XYZ Ltd"]}
      ],
      "explanation": "Professional introductions follow the pattern: Name + Position + Company"
    }
  ]
}'::jsonb
WHERE title = 'Business Introduction';

-- Update Casual Conversations lesson
UPDATE lessons 
SET content = '{
  "scenarios": ["Weekend plans", "Weather discussions", "Hobby conversations"],
  "key_phrases": ["What are your plans for the weekend?", "The weather is lovely today", "I really enjoy..."],
  "audio_content": [
    {
      "src": "https://www.soundjay.com/misc/sounds/casual-chat.mp3",
      "title": "Weekend Plans Conversation",
      "description": "Listen to a natural conversation about weekend activities",
      "type": "dialogue",
      "transcription": "A: What are your plans for the weekend? B: I''m thinking of going to the cinema. How about you? A: I might visit the market in Victoria Island."
    }
  ],
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600",
      "alt": "Friends having casual conversation",
      "title": "Casual Friendship",
      "description": "Examples of casual social interactions",
      "type": "cultural",
      "caption": "Casual conversations help build friendships and social connections",
      "vocabulary": [
        {"word": "Weekend", "definition": "Saturday and Sunday", "position": {"x": 30, "y": 40}},
        {"word": "Plans", "definition": "Things you intend to do", "position": {"x": 60, "y": 60}}
      ]
    }
  ],
  "exercises": [
    {
      "type": "drag-drop",
      "instruction": "Sort these conversation topics into appropriate categories:",
      "items": ["Weather", "Movies", "Work deadlines", "Hobbies", "Sports", "Office politics"],
      "categories": [
        {"name": "Casual Topics", "items": ["Weather", "Movies", "Hobbies", "Sports"]},
        {"name": "Avoid in Casual Chat", "items": ["Work deadlines", "Office politics"]}
      ],
      "explanation": "Casual conversations should focus on light, enjoyable topics rather than stressful work matters."
    }
  ]
}'::jsonb
WHERE title = 'Casual Conversations';

-- Update Travel & Tourism lesson
UPDATE lessons 
SET content = '{
  "scenarios": ["Hotel check-in", "Asking for directions", "Ordering at restaurants"],
  "key_phrases": ["I have a reservation under...", "Could you direct me to...?", "I''d like to order..."],
  "audio_content": [
    {
      "src": "https://www.soundjay.com/misc/sounds/hotel-checkin.mp3",
      "title": "Hotel Check-in Conversation",
      "description": "Learn how to check into a hotel professionally",
      "type": "dialogue",
      "transcription": "Receptionist: Good evening, how may I help you? Guest: I have a reservation under Smith. Receptionist: Let me check that for you..."
    }
  ],
  "images": [
    {
      "src": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600",
      "alt": "Hotel lobby reception",
      "title": "Hotel Reception Area",
      "description": "Common travel scenario - hotel check-in",
      "type": "scenario",
      "caption": "Hotel receptions are common places where clear English communication is essential",
      "vocabulary": [
        {"word": "Reception", "definition": "Hotel front desk area", "position": {"x": 50, "y": 30}},
        {"word": "Reservation", "definition": "A booking made in advance", "position": {"x": 70, "y": 50}}
      ]
    },
    {
      "src": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600",
      "alt": "Restaurant dining scene",
      "title": "Restaurant Ordering",
      "description": "Practice ordering food in English", 
      "type": "vocabulary",
      "caption": "Restaurants provide great opportunities to practice polite English conversation"
    }
  ],
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "What should you say first when checking into a hotel?",
      "options": [
        "Give me my room key",
        "I have a reservation under [your name]",
        "Where is my room?",
        "I want to check in"
      ],
      "correct": 1,
      "explanation": "Starting with your reservation details helps the receptionist assist you efficiently."
    }
  ]
}'::jsonb
WHERE title = 'Travel & Tourism';