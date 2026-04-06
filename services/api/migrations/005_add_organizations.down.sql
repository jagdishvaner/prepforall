DROP INDEX IF EXISTS idx_org_members_user;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP COLUMN IF EXISTS org_id;
DROP TABLE IF EXISTS org_members;
DROP TABLE IF EXISTS organizations;
