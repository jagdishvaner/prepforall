# 06 — Database Schema

> PostgreSQL 16. Multi-tenant with Organization → Batches → Students hierarchy.

**Related specs:** [05-backend-architecture](05-backend-architecture.md), [07-authentication](07-authentication.md), [09-test-assignment](09-test-assignment.md)

---

## Existing Tables (from SYSTEM_PLAN.md)

```sql
users, problems, test_cases, submissions, contests,
contest_problems, contest_participants, rating_history
```

## Modified Existing Table

```sql
-- Add org_id to users for direct org membership (students)
ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('super_admin', 'org_admin', 'trainer', 'student'));
```

## New Tables

### Multi-tenancy

```sql
organizations (
  id UUID PK,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

org_members (
  org_id UUID FK → organizations,
  user_id UUID FK → users,
  role TEXT CHECK (role IN ('org_admin', 'trainer')),
  PRIMARY KEY (org_id, user_id)
)
```

### Batch Management

```sql
batches (
  id UUID PK,
  org_id UUID FK → organizations,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID FK → users,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

batch_students (
  batch_id UUID FK → batches,
  user_id UUID FK → users,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (batch_id, user_id)
)
```

### Test Assignment

```sql
assigned_tests (
  id UUID PK,
  org_id UUID FK → organizations,
  batch_id UUID FK → batches,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('coding', 'sql', 'mixed')),
  time_limit_mins INT NOT NULL,
  created_by UUID FK → users,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  proctoring_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

test_problems (
  test_id UUID FK → assigned_tests,
  problem_id UUID FK → problems,
  display_order INT,
  points INT DEFAULT 10,
  PRIMARY KEY (test_id, problem_id)
)

test_attempts (
  id UUID PK,
  test_id UUID FK → assigned_tests,
  user_id UUID FK → users,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score INT,
  total_possible INT,
  status TEXT CHECK (status IN ('in_progress', 'submitted', 'expired')),
  tab_switch_count INT DEFAULT 0,
  UNIQUE (test_id, user_id)
)
```

### OAuth

```sql
oauth_accounts (
  id UUID PK,
  user_id UUID FK → users,
  provider TEXT CHECK (provider IN ('google', 'github')),
  provider_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, provider_id)
)
```

### Invites

```sql
user_invites (
  id UUID PK,
  email TEXT NOT NULL,
  org_id UUID FK → organizations,
  batch_id UUID FK → batches,
  role TEXT CHECK (role IN ('student', 'trainer', 'org_admin')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID FK → users,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Demo Requests (from marketing site)

```sql
demo_requests (
  id UUID PK,
  institution_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Key Indexes

```sql
-- Multi-tenancy
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_batches_org ON batches(org_id);
CREATE INDEX idx_batch_students_user ON batch_students(user_id);

-- Tests
CREATE INDEX idx_assigned_tests_batch ON assigned_tests(batch_id);
CREATE INDEX idx_assigned_tests_org ON assigned_tests(org_id);
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);

-- OAuth
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_invites_email ON user_invites(email);
CREATE INDEX idx_invites_token ON user_invites(token);
```

---

*Last updated: April 5, 2026*
