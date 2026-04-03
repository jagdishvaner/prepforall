CREATE TYPE verdict_type AS ENUM (
    'PENDING', 'RUNNING',
    'AC',   -- Accepted
    'WA',   -- Wrong Answer
    'TLE',  -- Time Limit Exceeded
    'MLE',  -- Memory Limit Exceeded
    'RE',   -- Runtime Error
    'CE'    -- Compilation Error
);

CREATE TABLE submissions (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id),
    problem_id    UUID         NOT NULL REFERENCES problems(id),
    contest_id    UUID,
    language      VARCHAR(30)  NOT NULL,
    code          TEXT         NOT NULL,
    verdict       verdict_type NOT NULL DEFAULT 'PENDING',
    runtime_ms    INTEGER,
    memory_kb     INTEGER,
    passed_cases  INTEGER      NOT NULL DEFAULT 0,
    total_cases   INTEGER      NOT NULL DEFAULT 0,
    error_msg     TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    judged_at     TIMESTAMPTZ
);

CREATE INDEX idx_submissions_user      ON submissions(user_id, created_at DESC);
CREATE INDEX idx_submissions_problem   ON submissions(problem_id);
CREATE INDEX idx_submissions_contest   ON submissions(contest_id) WHERE contest_id IS NOT NULL;
CREATE INDEX idx_submissions_verdict   ON submissions(verdict);
