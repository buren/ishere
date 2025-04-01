# IsHere - Link shortener service

## To do

- [ ] Create proper readme
- [ ] Fix all TODOs in code
- [ ] Add non-API routes /:id, /:namespace/:shortPath and */qr variations
- [ ] Consider alternative error format than the default used by zod
- [ ] Do we really want to use `Authorization: api-key: {api-key}` or should we just use a simple header, like `X-API-TOKEN` or `Authorization` straight up (related: consider using apiKey or apiToken consistently)

__New features__
- [ ] Consider adding support for a webhook each time a link is resolved

__Done__
- [x] Granular auth middlware, now it's for the all /api/link*
- [x] Add X-API-TOKEN auth header for backward compat
