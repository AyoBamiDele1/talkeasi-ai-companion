-- Phase 2: Content Expansion - Adding comprehensive lesson content

-- Academic Category Lessons
INSERT INTO public.lessons (title, description, difficulty, category, duration_minutes, content, is_premium) VALUES
('Research & Academic Discussions', 'Engage in scholarly conversations and present research findings effectively', 'Advanced', 'Academic English', 15, '{
  "scenarios": [
    "Presenting research findings to peers",
    "Discussing methodology with supervisors", 
    "Defending thesis arguments",
    "Collaborating on academic projects",
    "Peer review discussions"
  ],
  "key_phrases": [
    "Based on our findings...",
    "The methodology we employed...",
    "Our research indicates that...",
    "I would argue that...",
    "The implications of this study...",
    "Further research is needed to..."
  ]
}', false),

('University Life & Campus Communication', 'Navigate academic environments and communicate with faculty and students', 'Intermediate', 'Academic English', 12, '{
  "scenarios": [
    "Meeting with professors during office hours",
    "Group study sessions with classmates",
    "Asking questions in lectures",
    "Campus orientation discussions",
    "Academic counseling appointments"
  ],
  "key_phrases": [
    "Could you clarify this concept?",
    "I need help understanding...",
    "When is the assignment due?",
    "What are the requirements for...",
    "How can I improve my grade?",
    "I would like to schedule a meeting"
  ]
}', false),

-- Medical Category Lessons  
('Doctor Appointments & Health Discussions', 'Communicate effectively about health concerns and medical needs', 'Intermediate', 'Medical English', 12, '{
  "scenarios": [
    "Describing symptoms to a doctor",
    "Understanding medical instructions",
    "Pharmacy consultations",
    "Insurance and billing discussions",
    "Follow-up appointment scheduling"
  ],
  "key_phrases": [
    "I have been experiencing...",
    "The pain is located in...",
    "How often should I take this?",
    "Are there any side effects?",
    "I need to refill my prescription",
    "My insurance should cover this"
  ]
}', false),

('Medical Emergency Communication', 'Handle urgent medical situations with clear, effective communication', 'Advanced', 'Medical English', 10, '{
  "scenarios": [
    "Calling emergency services",
    "Explaining urgent symptoms",
    "Hospital admission procedures",
    "Communicating with emergency staff",
    "Providing medical history quickly"
  ],
  "key_phrases": [
    "This is an emergency!",
    "I need immediate medical attention",
    "The patient is unconscious",
    "Call an ambulance immediately",
    "I am allergic to...",
    "This started suddenly..."
  ]
}', false),

-- Technical English Category
('IT Support & Technical Communication', 'Explain and resolve technical issues clearly in professional settings', 'Intermediate', 'Technical English', 15, '{
  "scenarios": [
    "Troubleshooting software problems",
    "Explaining technical solutions to non-technical users",
    "Remote technical support calls",
    "System maintenance discussions",
    "Hardware problem descriptions"
  ],
  "key_phrases": [
    "Let me walk you through this step by step",
    "Have you tried restarting the system?",
    "The issue appears to be...",
    "I will need to update your software",
    "Please check your network connection",
    "This should resolve the problem"
  ]
}', false),

('Software Development Collaboration', 'Communicate effectively in tech teams and development environments', 'Advanced', 'Technical English', 18, '{
  "scenarios": [
    "Code review discussions",
    "Sprint planning meetings", 
    "Technical architecture debates",
    "Bug reporting and analysis",
    "Client requirement discussions",
    "Documentation and knowledge sharing"
  ],
  "key_phrases": [
    "This code could be optimized by...",
    "I suggest we implement...",
    "The current approach has limitations",
    "Let me refactor this section",
    "We need to consider scalability",
    "The deadline is tight, but achievable"
  ]
}', false),

-- Expanded Business Communication
('Contract Negotiations & Legal Discussions', 'Navigate business contracts and legal terminology professionally', 'Advanced', 'Business Communication', 20, '{
  "scenarios": [
    "Reviewing contract terms",
    "Negotiating business deals",
    "Legal compliance discussions",
    "Partnership agreement talks",
    "Dispute resolution meetings",
    "Intellectual property discussions"
  ],
  "key_phrases": [
    "According to clause...",
    "We need to revise this section",
    "The terms are acceptable provided that...",
    "I propose we modify...",
    "This violates our agreement",
    "Let me consult with legal counsel"
  ]
}', true),

('Team Meetings & Project Management', 'Lead and participate effectively in professional team environments', 'Intermediate', 'Business Communication', 15, '{
  "scenarios": [
    "Leading weekly team standup meetings",
    "Project status updates",
    "Brainstorming sessions",
    "Performance review discussions",
    "Budget planning meetings",
    "Deadline and milestone planning"
  ],
  "key_phrases": [
    "Let me update you on our progress",
    "We are ahead of schedule",
    "I need additional resources for...",
    "The project is facing some challenges",
    "Our next milestone is...",
    "Who will be responsible for...?"
  ]
}', false),

-- Expanded Travel & Tourism
('Airport & Immigration Procedures', 'Navigate international travel and official procedures confidently', 'Intermediate', 'Travel', 12, '{
  "scenarios": [
    "Airport check-in and security",
    "Immigration and customs interviews",
    "Flight delay and cancellation discussions",
    "Baggage claim issues",
    "Transit and connection inquiries",
    "Visa and documentation questions"
  ],
  "key_phrases": [
    "I am traveling to...",
    "The purpose of my visit is...",
    "How long will I be staying?",
    "My luggage seems to be missing",
    "What gate does my flight depart from?",
    "I need to change my flight"
  ]
}', false),

('Cultural Exchange & Social Integration', 'Build relationships and navigate cultural differences in international settings', 'Advanced', 'Travel', 15, '{
  "scenarios": [
    "Meeting new people from different cultures",
    "Discussing cultural traditions and customs",
    "Navigating social etiquette differences",
    "Participating in local community events",
    "Explaining Nigerian culture to others",
    "Understanding local social norms"
  ],
  "key_phrases": [
    "In my culture, we usually...",
    "That is interesting, how do you...",
    "I would love to learn about...",
    "We celebrate this by...",
    "What is the significance of...",
    "I respect your traditions"
  ]
}', false),

-- Expanded Daily Life
('Banking & Financial Services', 'Handle personal financial matters and banking procedures effectively', 'Beginner', 'Daily Life', 10, '{
  "scenarios": [
    "Opening a bank account",
    "Applying for loans or credit",
    "Online banking assistance",
    "Investment consultations",
    "Insurance policy discussions",
    "Budget planning with advisors"
  ],
  "key_phrases": [
    "I would like to open an account",
    "What are the interest rates?",
    "I need to transfer money",
    "My card is not working",
    "What documents do I need?",
    "Can you explain the fees?"
  ]
}', false),

('Shopping & Consumer Services', 'Navigate retail environments and consumer transactions confidently', 'Beginner', 'Daily Life', 10, '{
  "scenarios": [
    "Grocery shopping and product inquiries",
    "Clothing store interactions", 
    "Electronics and appliance purchases",
    "Return and exchange procedures",
    "Online shopping customer service",
    "Comparing prices and features"
  ],
  "key_phrases": [
    "Where can I find...?",
    "Do you have this in a different size?",
    "What is your return policy?",
    "Can I get a discount on this?",
    "I would like to exchange this",
    "Does this come with a warranty?"
  ]
}', false),

('Housing & Living Arrangements', 'Communicate about accommodation, utilities, and living situations', 'Intermediate', 'Daily Life', 12, '{
  "scenarios": [
    "Apartment hunting and viewings",
    "Landlord and tenant communications",
    "Utility setup and maintenance requests",
    "Neighborhood and community interactions",
    "Roommate discussions and agreements",
    "Home improvement and repairs"
  ],
  "key_phrases": [
    "I am looking for a place to rent",
    "What is included in the rent?",
    "There is a problem with...", 
    "When can you fix this?",
    "The lease agreement states...",
    "I need to give notice that..."
  ]
}', false);