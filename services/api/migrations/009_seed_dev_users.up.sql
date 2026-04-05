-- Seed default dev/test users (only for development)
-- Password for all three accounts: Test@1234

INSERT INTO users (username, email, password_hash, role)
VALUES
  ('admin', 'admin@prepforall.com', '$2a$10$0nPQGtEGeQV/QTUuGEN0c.lQvCJzA1dJ/.9i6OHubF9UpBQyQjRTa', 'super_admin'),
  ('trainer', 'trainer@prepforall.com', '$2a$10$0nPQGtEGeQV/QTUuGEN0c.lQvCJzA1dJ/.9i6OHubF9UpBQyQjRTa', 'trainer'),
  ('student', 'student@prepforall.com', '$2a$10$0nPQGtEGeQV/QTUuGEN0c.lQvCJzA1dJ/.9i6OHubF9UpBQyQjRTa', 'student')
ON CONFLICT (email) DO NOTHING;
