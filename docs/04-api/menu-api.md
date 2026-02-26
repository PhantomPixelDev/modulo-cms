# Menu API

Menu endpoints are exposed under `/api/menus`.

## Endpoints

- `GET /api/menus/slug/{slug}`
- `GET /api/menus/location/{location}`

## Middleware

- Protected by `throttle:api` rate limiter.

## Intended usage

- Fetch navigation structures for frontend rendering.
- Resolve menus by slug or registered location.

## Error handling

If a menu does not exist, consumers should handle non-200 responses gracefully.

## Related docs

- [Public Routes](./public-routes.md)
- [Auth and Rate Limits](./auth-and-rate-limits.md)
