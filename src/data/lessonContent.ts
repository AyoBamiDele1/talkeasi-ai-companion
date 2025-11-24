export interface LessonContentStructure {
  scenarios: string[];
  topics: string[];
  key_phrases: string[];
  conversation_starters: string[];
  depth_questions: string[];
  challenges: string[];
}

export const lessonContentDatabase: Record<string, LessonContentStructure> = {
  "AI Companion": {
    scenarios: [
      "Opening check-in and mood exploration",
      "Daily activities and experiences",
      "Interests and hobbies discussion",
      "Entertainment recommendations (movies, music, books)",
      "Weekend plans and aspirations",
      "Childhood memories and nostalgia",
      "Favorite foods and cooking",
      "Pets and animals",
      "Travel dreams and experiences",
      "Personal growth and self-reflection",
      "Stress relief and relaxation techniques",
      "Social connections and friendships",
      "Creative pursuits and passions",
      "Future hopes and goals",
      "Gratitude and positive moments"
    ],
    topics: [
      "mental wellbeing",
      "daily life",
      "entertainment",
      "hobbies",
      "relationships",
      "aspirations",
      "self-care",
      "memories",
      "interests",
      "emotions"
    ],
    key_phrases: [],
    conversation_starters: [
      "What's something good that happened today?",
      "What are you looking forward to this week?",
      "What's your favorite way to relax?",
      "Seen any good shows or movies lately?",
      "What made you smile recently?",
      "If you could do anything this weekend, what would it be?",
      "What's a hobby you've always wanted to try?",
      "What's your comfort food?",
      "What music have you been listening to?",
      "What's a happy memory from your childhood?"
    ],
    depth_questions: [
      "Tell me more about that - what makes it special to you?",
      "How did that make you feel?",
      "What do you enjoy most about that?",
      "Have you always been interested in that?",
      "What would your ideal day look like?",
      "What helps you feel better when you're down?",
      "Who are the most important people in your life?",
      "What are you most proud of?",
      "What's something you're grateful for today?",
      "What do you think about when you need inspiration?"
    ],
    challenges: []
  },

  "Job, Career & Interview Conversations": {
    scenarios: [
      "Tell me about yourself - personal introduction",
      "Why do you want to work here?",
      "What are your greatest strengths?",
      "What are your weaknesses? How do you handle them?",
      "Describe a challenging situation and how you handled it",
      "Where do you see yourself in 5 years?",
      "Tell me about a time you worked in a team",
      "How do you handle stress and pressure?",
      "Why should we hire you?",
      "Describe your leadership style",
      "Tell me about a time you failed and what you learned",
      "How do you prioritize multiple tasks?",
      "Questions to ask the interviewer",
      "Salary expectations discussion",
      "Technical skills deep dive"
    ],
    topics: [
      "career goals",
      "problem-solving",
      "teamwork",
      "leadership",
      "conflict resolution",
      "technical skills",
      "work ethic",
      "company research",
      "achievements",
      "professional development"
    ],
    key_phrases: [
      "In my previous role, I...",
      "One of my key strengths is...",
      "I successfully managed...",
      "I'm passionate about...",
      "I developed a solution that...",
      "My experience includes...",
      "I've consistently demonstrated...",
      "I'm excited about the opportunity to...",
      "I believe I would be a great fit because...",
      "Could you tell me more about...?"
    ],
    conversation_starters: [
      "Let's start with a common opener: Tell me about yourself and your background.",
      "Walk me through your resume, starting with your most recent role.",
      "What interests you most about this position?",
      "Describe your ideal work environment."
    ],
    depth_questions: [
      "Can you give me a specific example of that?",
      "What was the outcome of that situation?",
      "How did you measure success in that role?",
      "What did you learn from that experience?",
      "How would you apply that skill to this position?"
    ],
    challenges: [
      "behavioral question with STAR method",
      "unexpected technical question",
      "situational judgment test",
      "stress interview scenario",
      "case study problem-solving"
    ]
  },

  "Travel & Dream Destinations": {
    scenarios: [
      "Airport check-in and boarding",
      "Hotel reservation and check-in",
      "Asking for directions in a new city",
      "Ordering at a restaurant abroad",
      "Shopping for souvenirs",
      "Taxi or ride-sharing communication",
      "Emergency situations (lost passport, medical)",
      "Cultural site tour guide interaction",
      "Making new friends while traveling",
      "Customs and immigration",
      "Complaining about hotel service",
      "Booking tours and activities",
      "Currency exchange and banking",
      "Discussing travel experiences",
      "Sharing travel recommendations"
    ],
    topics: [
      "transportation",
      "accommodation",
      "dining",
      "sightseeing",
      "shopping",
      "emergencies",
      "culture",
      "budgeting",
      "itinerary planning",
      "travel tips"
    ],
    key_phrases: [
      "Excuse me, could you help me?",
      "How do I get to...?",
      "I'd like to book...",
      "What do you recommend?",
      "How much does this cost?",
      "Do you speak English?",
      "Where is the nearest...?",
      "I'm looking for...",
      "Can I have the bill, please?",
      "Is this included in the price?"
    ],
    conversation_starters: [
      "You've just arrived at the airport. Let's practice checking in for your flight.",
      "You're at a hotel reception. Practice checking in and asking about amenities.",
      "You're lost in a foreign city. Ask a local for directions.",
      "Time for dinner! Let's practice ordering at a restaurant."
    ],
    depth_questions: [
      "What's your dream travel destination and why?",
      "Have you traveled abroad before? Tell me about it.",
      "What do you find most challenging about traveling?",
      "What type of traveler are you - adventure, luxury, or budget?",
      "What's the most interesting place you've visited?"
    ],
    challenges: [
      "handle a travel emergency",
      "negotiate a price at a market",
      "explain dietary restrictions",
      "resolve a booking mistake",
      "navigate public transportation"
    ]
  },

  "Hobbies and Interests": {
    scenarios: [
      "Discussing favorite hobbies and pastimes",
      "Sharing passion projects",
      "Recommending activities to try",
      "Weekend and leisure routines",
      "Creative pursuits and artistic interests",
      "Sports and fitness activities",
      "Learning new skills and languages",
      "Collections and special interests",
      "Gaming and entertainment preferences",
      "Social hobbies and group activities",
      "Outdoor adventures and nature",
      "DIY and crafting projects",
      "Music and playing instruments",
      "Reading habits and book preferences",
      "Cultural activities and events"
    ],
    topics: [
      "leisure activities",
      "creativity",
      "sports",
      "arts and music",
      "reading",
      "gaming",
      "crafts",
      "outdoor activities",
      "social activities",
      "personal interests",
      "skill development",
      "entertainment",
      "cultural pursuits",
      "collections",
      "fitness"
    ],
    key_phrases: [
      "I'm really into...",
      "In my free time, I...",
      "Have you ever tried...?",
      "I've been practicing...",
      "My favorite thing to do is...",
      "I recently started...",
      "I've always wanted to learn...",
      "What I love most about it is...",
      "I'm passionate about...",
      "It helps me unwind by..."
    ],
    conversation_starters: [
      "What do you like to do in your free time?",
      "Do you have any hobbies you're really passionate about?",
      "Have you picked up any new interests recently?",
      "What's something you've always wanted to try?",
      "How do you usually spend your weekends?"
    ],
    depth_questions: [
      "What got you interested in that hobby?",
      "How long have you been doing that?",
      "What's the most rewarding part about it?",
      "Have you met interesting people through this hobby?",
      "Would you recommend this to others? Why?",
      "What's your next goal related to this interest?",
      "How does this hobby make you feel?",
      "What's the biggest challenge you've faced with it?"
    ],
    challenges: [
      "explain your hobby to a beginner",
      "recommend similar activities",
      "share a memorable experience",
      "discuss how your hobby has changed you",
      "compare different hobbies"
    ]
  },

  "Health, Wellness & Lifestyle": {
    scenarios: [
      "Discussing fitness routines and exercise",
      "Healthy eating habits and nutrition",
      "Stress management techniques",
      "Sleep habits and routines",
      "Work-life balance strategies",
      "Mental wellness and mindfulness",
      "Doctor and medical appointments",
      "Setting wellness goals",
      "Self-care practices",
      "Lifestyle changes and improvements",
      "Managing chronic conditions",
      "Preventive health measures",
      "Meditation and yoga practices",
      "Healthy habit formation",
      "Recovery and rest days"
    ],
    topics: [
      "exercise and fitness",
      "nutrition",
      "mental health",
      "sleep",
      "stress management",
      "wellness",
      "healthy habits",
      "lifestyle",
      "self-care",
      "mindfulness",
      "medical visits",
      "work-life balance",
      "preventive care",
      "holistic health",
      "recovery"
    ],
    key_phrases: [
      "I've been trying to...",
      "My routine includes...",
      "I find that... helps me...",
      "I'm working on improving my...",
      "A healthy habit I practice is...",
      "I make sure to...",
      "It's important to me to...",
      "I've noticed that when I...",
      "My goal is to...",
      "I feel better when I..."
    ],
    conversation_starters: [
      "What does your typical fitness routine look like?",
      "How do you manage stress in your daily life?",
      "What healthy habits are you working on?",
      "How do you prioritize your wellbeing?",
      "What does self-care mean to you?"
    ],
    depth_questions: [
      "What motivated you to focus on your health?",
      "How has your lifestyle changed over time?",
      "What's the biggest challenge in maintaining healthy habits?",
      "How do you balance health goals with daily responsibilities?",
      "What wellness practice has made the biggest difference for you?",
      "How do you stay motivated to keep up with your routine?",
      "What advice would you give someone starting their wellness journey?",
      "How do you know when you need to rest or take a break?"
    ],
    challenges: [
      "explain your wellness routine",
      "discuss overcoming health obstacles",
      "share tips for staying consistent",
      "talk about mental and physical health connection",
      "describe your ideal healthy day"
    ]
  }
};

// Mapping from database lesson titles to content keys
const LESSON_TITLE_MAPPING: Record<string, string> = {
  "AI Companion": "AI Companion",
  "Job, Career & Interview Conversations": "Job, Career & Interview Conversations",
  "Travel & Dream Destinations": "Travel & Dream Destinations",
  "Hobbies and Interests": "Hobbies and Interests",
  "Health, Wellness & Lifestyle": "Health, Wellness & Lifestyle"
};

export function getLessonContentByTitle(dbTitle: string): LessonContentStructure | null {
  const mappedKey = LESSON_TITLE_MAPPING[dbTitle];
  if (!mappedKey) {
    console.warn(`No content mapping found for lesson: ${dbTitle}`);
    return null;
  }
  return lessonContentDatabase[mappedKey] || null;
}

export const getTopicsForLesson = (lessonTitle: string): string[] => {
  const content = getLessonContentByTitle(lessonTitle);
  return content?.topics || [];
};

export const getNextScenario = (
  lessonTitle: string, 
  coveredScenarios: Set<string>
): string | null => {
  const content = getLessonContentByTitle(lessonTitle);
  if (!content) return null;
  
  const available = content.scenarios.filter(s => !coveredScenarios.has(s));
  if (available.length === 0) {
    // All scenarios covered, restart from beginning
    return content.scenarios[0];
  }
  
  // Return next uncovered scenario
  return available[0];
};

export const getConversationPrompt = (
  lessonTitle: string,
  messageCount: number
): string | null => {
  const content = getLessonContentByTitle(lessonTitle);
  if (!content) return null;
  
  // Rotate through starters and depth questions
  if (messageCount % 8 === 0 && content.conversation_starters.length > 0) {
    const index = Math.floor(messageCount / 8) % content.conversation_starters.length;
    return content.conversation_starters[index];
  }
  
  if (messageCount % 5 === 0 && content.depth_questions.length > 0) {
    const index = Math.floor(messageCount / 5) % content.depth_questions.length;
    return content.depth_questions[index];
  }
  
  return null;
};
