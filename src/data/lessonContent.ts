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

  "Job Interview Practice": {
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

  "Travel & Tourism": {
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

  "Business Introduction": {
    scenarios: [
      "Formal self-introduction in a meeting",
      "Introducing your company",
      "Explaining your role and responsibilities",
      "Networking event introduction",
      "Conference presentation opening",
      "Client first meeting introduction",
      "Email introduction follow-up",
      "Introducing a colleague",
      "Elevator pitch (30-second introduction)",
      "LinkedIn connection request context",
      "Cold call introduction",
      "Partnership proposal introduction",
      "Investor pitch introduction",
      "Cross-cultural business introduction",
      "Virtual meeting introduction"
    ],
    topics: [
      "professional background",
      "company overview",
      "industry expertise",
      "value proposition",
      "networking",
      "collaboration opportunities",
      "business goals",
      "achievements",
      "services/products",
      "target audience"
    ],
    key_phrases: [
      "I'm pleased to meet you.",
      "Let me introduce myself...",
      "My name is... and I work at...",
      "I specialize in...",
      "Our company focuses on...",
      "I've been in this industry for...",
      "I'd love to learn more about your work.",
      "Perhaps we could explore opportunities to collaborate.",
      "I look forward to connecting with you.",
      "Thank you for taking the time to meet with me."
    ],
    conversation_starters: [
      "Imagine you're at a networking event. How would you introduce yourself?",
      "Let's practice a formal business introduction for a client meeting.",
      "Give me your elevator pitch - you have 30 seconds.",
      "Introduce your company to a potential partner."
    ],
    depth_questions: [
      "What makes your approach unique?",
      "How did you get started in this field?",
      "What are your company's core values?",
      "Who is your ideal client or customer?",
      "What challenges do you help solve?"
    ],
    challenges: [
      "adapt introduction for different audience",
      "handle unexpected questions after introduction",
      "introduce yourself in under 15 seconds",
      "memorable introduction that stands out",
      "virtual vs in-person introduction differences"
    ]
  },

  "Casual Conversations": {
    scenarios: [
      "Weekend plans discussion",
      "Favorite hobbies and interests",
      "Recent movies or TV shows",
      "Sports and fitness chat",
      "Food and cooking experiences",
      "Music preferences and concerts",
      "Pet stories and animal talk",
      "Weather and seasonal activities",
      "Funny stories and anecdotes",
      "Book recommendations",
      "Gaming and technology",
      "Fashion and style",
      "Home and living space",
      "Local events and activities",
      "Childhood memories"
    ],
    topics: [
      "entertainment",
      "leisure activities",
      "daily life",
      "pop culture",
      "personal interests",
      "social life",
      "family",
      "friends",
      "celebrations",
      "experiences"
    ],
    key_phrases: [
      "How's it going?",
      "What have you been up to?",
      "That sounds fun!",
      "I totally agree!",
      "Tell me more about that.",
      "Have you tried...?",
      "That reminds me of...",
      "I'm a big fan of...",
      "What do you think about...?",
      "By the way..."
    ],
    conversation_starters: [
      "So, what are your plans for the weekend?",
      "Seen any good movies lately?",
      "Do you have any hobbies you're passionate about?",
      "What kind of music do you listen to?",
      "Any favorite restaurants or dishes?"
    ],
    depth_questions: [
      "What got you interested in that?",
      "Do you have a favorite memory related to that?",
      "If you could try anything new, what would it be?",
      "What's something most people don't know about you?",
      "What makes you laugh the most?"
    ],
    challenges: [
      "keep conversation flowing naturally",
      "transition between topics smoothly",
      "show genuine interest",
      "share personal anecdotes",
      "practice active listening"
    ]
  },

  "Phone Conversation": {
    scenarios: [
      "Answering a professional call",
      "Making an appointment",
      "Customer service complaint",
      "Leaving a voicemail message",
      "Taking a message for someone",
      "Clarifying information on call",
      "Rescheduling an appointment",
      "Calling about a job application",
      "Technical support call",
      "Sales inquiry call",
      "Confirming details over phone",
      "Handling difficult customers",
      "Conference call participation",
      "Following up after meeting",
      "Networking cold call"
    ],
    topics: [
      "phone etiquette",
      "active listening",
      "clear communication",
      "problem-solving",
      "scheduling",
      "information gathering",
      "professional tone",
      "message taking",
      "follow-up",
      "conflict resolution"
    ],
    key_phrases: [
      "Thank you for calling...",
      "How may I help you?",
      "Could you please hold?",
      "Let me transfer you to...",
      "I'm calling regarding...",
      "Could you repeat that, please?",
      "Let me check on that for you.",
      "I'll get back to you shortly.",
      "Is there anything else I can help you with?",
      "Thank you for your time."
    ],
    conversation_starters: [
      "Ring ring! Practice answering a professional business call.",
      "You need to make an appointment. Let's practice that call.",
      "A customer is calling with a complaint. How do you handle it?",
      "Practice leaving a clear, professional voicemail."
    ],
    depth_questions: [
      "How do you ensure clear communication on phone?",
      "What's challenging about phone conversations vs face-to-face?",
      "How do you handle misunderstandings on calls?",
      "What makes a phone conversation professional?",
      "How do you maintain focus during long calls?"
    ],
    challenges: [
      "handle angry customer",
      "understand accent or unclear speech",
      "multitask while on call",
      "stay calm under pressure",
      "end call professionally when rushed"
    ]
  }
};

export const getTopicsForLesson = (lessonTitle: string): string[] => {
  const content = lessonContentDatabase[lessonTitle];
  return content?.topics || [];
};

export const getNextScenario = (
  lessonTitle: string, 
  coveredScenarios: Set<string>
): string | null => {
  const content = lessonContentDatabase[lessonTitle];
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
  const content = lessonContentDatabase[lessonTitle];
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
