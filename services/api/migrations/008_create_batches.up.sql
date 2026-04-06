CREATE TABLE batches (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    start_date DATE,
    end_date   DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batch_students (
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (batch_id, user_id)
);

-- Backfill the batch_id FK for user_invites
ALTER TABLE user_invites ADD CONSTRAINT fk_invites_batch
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL;

CREATE INDEX idx_batches_org ON batches(org_id);
CREATE INDEX idx_batch_students_user ON batch_students(user_id);
