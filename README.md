# IsHere - Link shortener service

## To do

- [ ] Add /ishere details {id} slack command that returns detailed infromation about link (such as ID, namespace, ttl etc)
- [ ] Create proper readme
- [ ] Fix all TODOs in code
- [ ] Add non-API routes /:id, /:namespace/:shortPath and */qr variations
- [ ] Consider alternative error format than the default used by zod
- [x] Do we really want to use `Authorization: api-key: {api-key}` or should we just use a simple header, like `X-API-KEY` or `Authorization` straight up (related: consider using apiKey or apiToken consistently)
- [ ] Add expiration to LinkSchema


__New features__
- [ ] Consider adding support for a webhook each time a link is resolved
- [ ] Consider adding support for listing links under specific namespace, e.g all links `/something/*`
- [ ] Consider adding `isBot` property, https://github.com/omrilotan/isbot
- [ ] Consider caching a cache miss (as per discussion with Teo)

__Done__
- [x] Granular auth middlware, now it's for the all /api/link*
- [x] Add X-API-KEY auth header for backward compat
