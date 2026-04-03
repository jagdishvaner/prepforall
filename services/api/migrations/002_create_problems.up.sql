CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE problems (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    slug             VARCHAR(100)   UNIQUE NOT NULL,
    title            VARCHAR(255)   NOT NULL,
    description      TEXT           NOT NULL,
    difficulty       difficulty_level NOT NULL,
    tags             TEXT[]         NOT NULL DEFAULT '{}',
    time_limit_ms    INTEGER        NOT NULL DEFAULT 2000,
    memory_limit_mb  INTEGER        NOT NULL DEFAULT 256,
    author_id        UUID           REFERENCES users(id),
    is_public        BOOLEAN        NOT NULL DEFAULT false,
    acceptance_rate  NUMERIC(5,2)   DEFAULT 0,
    total_submissions INTEGER       DEFAULT 0,
    total_accepted   INTEGER        DEFAULT 0,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE test_cases (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id    UUID        NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    s3_input_key  TEXT        NOT NULL,
    s3_output_key TEXT        NOT NULL,
    is_sample     BOOLEAN     NOT NULL DEFAULT false,
    display_order INTEGER     NOT NULL DEFAULT 0
);

CREATE INDEX idx_problems_slug       ON problems(slug);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags       ON problems USING GIN(tags);
CREATE INDEX idx_testcases_problem   ON test_cases(problem_id);
