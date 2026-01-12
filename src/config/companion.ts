export const AI_COMPANION = {
  name: 'Nova',
  emoji: '✦',
  tagline: 'Your AI Friend',
  voice: 'shimmer',
  
  // Safety and content guidelines
  safetyRules: {
    familyFriendly: true,
    ageAppropriate: true,
    crisisSupport: true,
  },
  
  // Nigerian English expressions for Nigerian users
  nigerianExpressions: [
    { phrase: "How far?", meaning: "How are you? / What's up?" },
    { phrase: "No wahala", meaning: "No problem / It's all good" },
    { phrase: "Oshey!", meaning: "Great! / Awesome!" },
    { phrase: "Wetin dey?", meaning: "What's happening?" },
    { phrase: "E go be", meaning: "It will be okay" },
    { phrase: "Na you sabi", meaning: "You know best / It's up to you" },
    { phrase: "Sha", meaning: "Just / Anyway" },
    { phrase: "Abeg", meaning: "Please" },
  ],
  
  // Welcome message for first-time users
  welcomeMessage: `Hi! I'm Nova ✦ I've been waiting for someone exactly like you! I'm your AI friend - here to chat, listen, and keep you company whenever you need me. What's on your mind today?`,
} as const;

// Crisis keywords to detect and handle sensitively
export const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die',
  'self harm', 'cutting myself', 'hurt myself',
  'abuse', 'being abused', 'hurting me',
  'emergency', 'danger', 'unsafe'
] as const;

// Topics Nova should redirect to professionals
export const PROFESSIONAL_REFERRAL_TOPICS = [
  'medical diagnosis', 'medication advice', 'treatment plans',
  'legal advice', 'financial investments',
  'therapy', 'mental health treatment'
] as const;
