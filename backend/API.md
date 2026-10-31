# AnonFeedback: API reference

REST + JSON, served by the Express backend (`backend/src/routes`). The browser calls it as `/api/*` on the
Next.js origin, which proxies to Express. Auth is an httpOnly session cookie. Responses expose only the mask
`handle`, never another user's account id or email. Tables and rules live in `backend/migrations`.

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup` | email, password → creates account + profile (random handle) |
| POST | `/auth/login` | rate-limited, lockout after N failures |
| POST | `/auth/logout` | |
| POST | `/auth/password-reset` | sends email with token |
| POST | `/auth/password-reset/confirm` | token + new password |
| POST | `/auth/verify-email` | |

## Me / profiles
| Method | Path | Notes |
|---|---|---|
| GET | `/me` | own profile, plan, scores, limits used |
| POST | `/me/handle/regenerate` | new random handle (profile page) |
| DELETE | `/me` | account deletion (cascades) |
| GET | `/leaderboard?by=builder\|reviewer` | top 20, score > 0 |

## Projects
| Method | Path | Notes |
|---|---|---|
| GET | `/projects?category=&sort=new\|top&q=&cursor=` | feed, cursor pagination, hides `hidden_at` |
| POST | `/projects` | enforces Free limit (5) server-side |
| GET | `/projects/:id` | |
| PATCH | `/projects/:id` | owner only (e.g. `download_permission`) |
| DELETE | `/projects/:id` | owner only; also deletes storage object |
| GET | `/me/projects` | |
| POST | `/uploads/sign` | file name, type, size → signed upload URL; rejects over 50MB (Free) / 500MB (Pro) and disallowed types |
| GET | `/projects/:id/download` | checks `download_permission` (`off` = owner only), returns short-lived signed URL |

## Feedback
| Method | Path | Notes |
|---|---|---|
| GET | `/projects/:id/feedback` | |
| POST | `/projects/:id/feedback` | one per user (409 if duplicate); Free: 15 per 24h (429); not own project |
| POST | `/feedback/:id/helpful` | project owner only, idempotent |
| GET | `/me/feedback` | reviews I gave |

## Rooms
| Method | Path | Notes |
|---|---|---|
| GET | `/rooms` | |
| POST | `/rooms` | create custom room |
| GET | `/rooms/:id/messages?after=` | last 200 |
| POST | `/rooms/:id/messages` | rate-limit 1 msg/sec per user, max 2000 chars |
| WS | `/rooms/:id/stream` | live messages (or SSE / Supabase Realtime) |

## Reports and moderation
| Method | Path | Notes |
|---|---|---|
| POST | `/reports` | target_type, target_id, reason; unique per reporter+target |
| GET | `/admin/reports?status=open` | moderator/admin |
| PATCH | `/admin/reports/:id` | dismiss or action (hides content, optional ban) |
| POST | `/admin/accounts/:id/ban` | |

## Billing
| Method | Path | Notes |
|---|---|---|
| POST | `/billing/checkout` | creates Stripe/Razorpay checkout session |
| POST | `/billing/portal` | manage/cancel |
| POST | `/billing/webhook` | signature-verified; only this endpoint flips `subscription_status` |

## Cross-cutting
- **Never trust the client:** plan limits, scores, vote counters and ownership checks live in DB triggers (`migrations/*_triggers.js`) and the route handlers, not the UI.
- **Anonymity:** no uid/email in public payloads; keep access logs free of IP-to-handle joins; short log retention.
- **Security:** argon2id hashing, CSRF protection for cookie auth, CORS allow-list, input validation (zod), per-IP and per-user rate limits.
- **Errors:** `{ "error": { "code": "free_plan_review_limit", "message": "..." } }` with 401/403/404/409/429.
