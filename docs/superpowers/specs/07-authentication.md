# 07 — Authentication System

> JWT + OAuth (Google, GitHub) + invite-only registration. Modal-based login (LeetCode-style).

**Related specs:** [04-platform-app](04-platform-app.md), [05-backend-architecture](05-backend-architecture.md), [06-database-schema](06-database-schema.md)

---

## Login (modal-based, LeetCode-style)

Login appears as a modal overlay on the current page. User stays in context.

**Options:**
- Email + password
- Continue with Google (OAuth 2.0)
- Continue with GitHub (OAuth 2.0)

No "Create Account" link. B2B invite-only.

## OAuth Flow (Google/GitHub)

1. User clicks "Continue with Google" → frontend opens popup to `GET /api/v1/auth/google`
2. API redirects to Google OAuth consent screen
3. User approves → Google redirects to `GET /api/v1/auth/google/callback?code=xxx`
4. API exchanges code for Google profile (email, name, avatar)
5. API looks up user by email → must already exist (invite-only)
6. User exists → issue JWT + set refresh token cookie → popup returns tokens via `postMessage`
7. User doesn't exist → reject with "No account found. Contact your admin."
8. Parent window stores JWT in Zustand, closes popup, refetches data

## Registration (invite-only)

1. Admin creates invite: `POST /api/v1/users/invite { email, role, org_id, batch_id }`
2. Email sent with setup link: `app.prepforall.com/auth/setup?token=abc123`
3. User clicks link → setup page: choose username + password, OR link Google/GitHub
4. Account activated → redirected to dashboard

## Token Strategy

| Token | Storage | Lifetime |
|---|---|---|
| Access JWT (HS256) | Zustand (memory) | 15 min |
| Refresh token | httpOnly cookie | 7 days |
| Invite token | DB + email link | 72 hours |

## Password Reset

Standard email reset link flow:
1. User clicks "Forgot password?" → enters email
2. API sends reset email with token link (expires 1 hour)
3. User clicks link → set new password
4. Token invalidated after use

## Auth Guard (TanStack Router)

`beforeLoad` on `__root.tsx` checks JWT validity. If expired, attempts silent refresh. If refresh fails, shows login modal without redirecting away from current page.

## RBAC Enforcement

Role checks happen at two levels:
1. **API middleware** (`pkg/middleware/rbac.go`) — enforces at route level based on JWT claims
2. **Frontend route guards** (`beforeLoad`) — hides routes the user can't access

---

*Last updated: April 5, 2026*
