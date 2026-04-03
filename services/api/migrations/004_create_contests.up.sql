CREATE TYPE contest_type AS ENUM ('ICPC', 'IOI', 'rated', 'unrated');

CREATE TABLE contests (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_time  TIMESTAMPTZ  NOT NULL,
    end_time    TIMESTAMPTZ  NOT NULL,
    type        contest_type NOT NULL DEFAULT 'rated',
    created_by  UUID         REFERENCES users(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE contest_problems (
    contest_id UUID    NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID    NOT NULL REFERENCES problems(id),
    points     INTEGER NOT NULL DEFAULT 100,
    display_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (contest_id, problem_id)
);

CREATE TABLE contest_participants (
    contest_id UUID    NOT NULL REFERENCES contests(id),
    user_id    UUID    NOT NULL REFERENCES users(id),
    score      INTEGER NOT NULL DEFAULT 0,
    penalty    INTEGER NOT NULL DEFAULT 0,
    rank       INTEGER,
    PRIMARY KEY (contest_id, user_id)
);

CREATE TABLE rating_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id),
    contest_id  UUID        NOT NULL REFERENCES contests(id),
    old_rating  INTEGER     NOT NULL,
    new_rating  INTEGER     NOT NULL,
    delta       INTEGER     GENERATED ALWAYS AS (new_rating - old_rating) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_time        ON contests(start_time, end_time);
CREATE INDEX idx_participants_contest ON contest_participants(contest_id, score DESC);
CREATE INDEX idx_rating_user          ON rating_history(user_id, created_at DESC);
