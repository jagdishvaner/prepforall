# 10 — Analytics Engine

> Student-wise progress, batch-wise reports, topic breakdown, CSV/PDF exports.

**Related specs:** [04-platform-app](04-platform-app.md), [06-database-schema](06-database-schema.md)

---

## Student Progress View

Visible to: trainer, org admin, super admin (for their scope)

- Stat cards: problems solved, tests taken, avg score, streak
- Topic-wise breakdown table (topic, solved, total, accuracy, progress bar)
- Test performance history table (test, score, rank, date)
- Activity heatmap (GitHub-style, daily solve activity)

## Batch Analytics View

Visible to: trainer (own batches), org admin (all org batches)

- Stat cards: avg score, avg solve rate, active students (7d), test completion rate
- Student leaderboard (rank, name, solved, avg score, trend)
- Topic-wise aggregate performance
- Test results trend (line chart over weeks)
- At-risk students (< 40% avg OR inactive > 3 days) — flagged automatically

## Org-wide Analytics

Visible to: org admin

- Cross-batch comparison
- Trainer activity overview
- Export to CSV/PDF for reporting to college management

## Technical Approach

- **Charts:** Recharts (lightweight, React-native)
- **Query strategy:** Compute on read (no materialized views yet). Add materialized views when queries get slow (>10K students).
- **Backend:** `internal/analytics/repository.go` with aggregation queries against submissions, test_attempts, batch_students tables.

---

*Last updated: April 5, 2026*
