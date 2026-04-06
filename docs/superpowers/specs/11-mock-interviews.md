# 11 — Mock Interview Portal (Deferred)

> Designed but deferred to Sub-project 4.

**Related specs:** [04-platform-app](04-platform-app.md), [08-judge-system](08-judge-system.md)

---

## Key Decisions (already made)

- **Video/audio:** Third-party SDK (100ms, Daily.co, or Livekit) — not self-hosted WebRTC
- **Collaborative editor:** Monaco Editor with Yjs (CRDT) for real-time collaboration
- **Code execution:** Reuse existing judge system
- **Scheduling:** Trainer creates interview slot, student books it
- **Cost estimate:** ~$0.004/participant/minute (~$48/mo at 100 interviews/month)

## Scope

Detailed design will be done when Sub-project 3 (Training Management) is complete.

---

*Last updated: April 5, 2026*
