-- Add images to first 2 questions
UPDATE questions SET image_filename = 'eiffel-tower.jpg' WHERE id = 1;
UPDATE questions SET image_filename = 'javascript-code.jpg' WHERE id = 2;
