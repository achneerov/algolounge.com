-- Seed test user accounts
-- Member account: member@algolounge.com / algolounge123
INSERT INTO `users` (`username`, `email`, `password_hash`, `role_id`)
VALUES ('member', 'member@algolounge.com', '$2b$10$BXJ841nJrZPtunPwfP.z2uu0arJvQu9NNcvMwcWR//D9.KGtXmzGe', 2);
--> statement-breakpoint
-- Admin account: admin@algolounge.com / algolounge123
INSERT INTO `users` (`username`, `email`, `password_hash`, `role_id`)
VALUES ('admin', 'admin@algolounge.com', '$2b$10$BDUcC5hgX7az0OdW/sZQnuGji24BM7r5MZ1WkiF5S2lUEO6YkZgJu', 1);
