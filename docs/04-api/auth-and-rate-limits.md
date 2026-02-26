# Auth and Rate Limits

Modulo CMS applies layered throttling to reduce abuse and brute force attempts.

## Global rate limiters

Configured in application provider:
- `api`: 60 req/min by user ID (or IP fallback)
- `auth`: stricter limits by email+IP and IP

## Route-level throttles

Examples:
- Search route: `throttle:60,1`
- Public taxonomy/content group: `throttle:30,1`
- Comment posting: `throttle:15,1`
- Auth routes (login/register/password reset): `throttle:auth`

## Admin access model

Admin routes require:
- authenticated user
- verified email
- role or permission checks

## Security recommendations

- Keep throttles enabled in all environments.
- Review limits if traffic profile changes.
- Monitor repeated 429/401 patterns.

## Related docs

- [Public Routes](./public-routes.md)
- [Incident Runbook](../05-operations/incident-runbook.md)
