# Media and Comments

This page summarizes media handling and comment flow at a high level.

## Media

Modulo CMS uses a media library integration for upload/attachment workflows.

Typical concerns:
- file validation
- storage visibility
- transformation and retrieval

## Comments

Comment submission is exposed via post comment endpoint and protected by throttling.

Key behaviors:
- comment creation on post route
- moderation/publishing controls in admin workflows
- request throttling to reduce abuse

## Operational guidance

- Verify upload limits at web/app layers.
- Use rate limiting and monitoring for comment endpoints.

## Related docs

- [Auth and Rate Limits](../04-api/auth-and-rate-limits.md)
- [Healthchecks and Observability](../05-operations/healthchecks-and-observability.md)
