-- Update durations for the 4 MVP lessons
UPDATE lessons 
SET duration_minutes = 5 
WHERE id = '9b25e5bb-3702-448f-aae7-39c0b44fb558'; -- Friendly Chat

UPDATE lessons 
SET duration_minutes = 5 
WHERE id = '32b11451-fca8-4b46-94d9-7fbd7b0bdfb1'; -- Business Introduction

UPDATE lessons 
SET duration_minutes = 7 
WHERE id = 'b1b45d3b-e8d4-4ff6-8184-3dcc8452c0a4'; -- Job Interview Practice

UPDATE lessons 
SET duration_minutes = 7 
WHERE id = 'd40a2170-376f-4749-a277-772a37f0877f'; -- Customer Service Excellence

-- Delete all lessons except the 4 MVP lessons
DELETE FROM lessons 
WHERE id NOT IN (
  '9b25e5bb-3702-448f-aae7-39c0b44fb558', -- Friendly Chat
  '32b11451-fca8-4b46-94d9-7fbd7b0bdfb1', -- Business Introduction
  'b1b45d3b-e8d4-4ff6-8184-3dcc8452c0a4', -- Job Interview Practice
  'd40a2170-376f-4749-a277-772a37f0877f'  -- Customer Service Excellence
);