# 09 — Test Assignment System

> Trainers create timed tests, assign to student batches, with optional proctoring.

**Related specs:** [04-platform-app](04-platform-app.md), [06-database-schema](06-database-schema.md), [08-judge-system](08-judge-system.md)

---

## Trainer Creates a Test

- Pick problems from the problem bank (modal picker with search/filter)
- Set time limit, points per problem, schedule window
- Assign to a batch
- Save as draft or publish immediately

## Student Takes a Test

- Countdown timer always visible, auto-submits on expiry
- Problem navigation bar (solved/attempted/not started indicators)
- Same split-pane workspace as regular problem solving
- Code persists in localStorage (survives browser crash)
- Submit Test locks all problems

## Anti-cheating (basic)

- Tab switch detection (`visibilitychange` event) — count logged, shown to trainer
- Copy-paste tracking in editor — logged
- IP logging per session
- Optional "proctoring mode" flag per test (trainer enables)

## Test Lifecycle

```
Draft → Published → Live (during schedule window) → Ended
```

Trainer can view results at any stage after the test starts.

## Grading

- Each problem has assigned points (set during test creation)
- Score = sum of points for accepted problems
- Partial credit: not supported in v1 (binary pass/fail per problem)
- Rankings computed per test, displayed to trainer

---

*Last updated: April 5, 2026*
