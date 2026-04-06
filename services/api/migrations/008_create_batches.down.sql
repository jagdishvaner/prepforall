DROP INDEX IF EXISTS idx_batch_students_user;
DROP INDEX IF EXISTS idx_batches_org;
ALTER TABLE user_invites DROP CONSTRAINT IF EXISTS fk_invites_batch;
DROP TABLE IF EXISTS batch_students;
DROP TABLE IF EXISTS batches;
