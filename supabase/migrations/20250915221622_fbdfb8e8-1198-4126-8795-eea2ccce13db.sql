-- Add more lesson content for better variety
INSERT INTO lessons (title, description, difficulty, category, duration_minutes, content) VALUES 
('Small Talk & Networking', 'Master the art of professional small talk and networking conversations', 'Beginner', 'Business Communication', 15, '{
  "scenarios": ["Conference networking", "Office elevator talks", "Client lunch conversations"],
  "key_phrases": ["How are you enjoying the event?", "What brings you here today?", "I''d love to stay in touch"]
}'),
('Job Interview Practice', 'Prepare for common interview questions and scenarios', 'Intermediate', 'Business Communication', 20, '{
  "scenarios": ["Behavioral questions", "Technical discussions", "Salary negotiations"],
  "key_phrases": ["Tell me about yourself", "My greatest strength is...", "I have experience in..."]
}'),
('Customer Service Excellence', 'Handle customer inquiries and complaints professionally', 'Intermediate', 'Customer Service', 25, '{
  "scenarios": ["Complaint handling", "Product explanations", "Follow-up calls"],
  "key_phrases": ["I understand your concern", "Let me help you with that", "Is there anything else I can assist you with?"]
}'),
('Casual Conversations', 'Practice everyday English conversations with friends', 'Beginner', 'Daily Life', 10, '{
  "scenarios": ["Weekend plans", "Weather discussions", "Hobby conversations"],
  "key_phrases": ["What are your plans for the weekend?", "The weather is lovely today", "I really enjoy..."]
}'),
('Travel & Tourism', 'Navigate travel situations confidently', 'Intermediate', 'Travel', 20, '{
  "scenarios": ["Hotel check-in", "Asking for directions", "Ordering at restaurants"],
  "key_phrases": ["I have a reservation under...", "Could you direct me to...?", "I''d like to order..."]
}');

-- Update existing lessons with better content
UPDATE lessons SET 
  content = '{
    "scenarios": ["Restaurant orders", "Menu discussions", "Payment and tips"],
    "key_phrases": ["I''d like to order...", "Could I have the menu please?", "The bill, please"]
  }'
WHERE title = 'Business Introduction';

UPDATE lessons SET 
  content = '{
    "scenarios": ["Appointment scheduling", "Business inquiries", "Follow-up calls"],
    "key_phrases": ["I''m calling to schedule...", "Could we arrange a meeting?", "Thank you for your time"]
  }'
WHERE title = 'Phone Conversations';

UPDATE lessons SET 
  content = '{
    "scenarios": ["Team presentations", "Client pitches", "Progress reports"],
    "key_phrases": ["Today I will present...", "The main benefits are...", "To summarize..."]
  }'
WHERE title = 'Presentation Skills';