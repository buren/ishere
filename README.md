# IsHere - Link shortener service

## To do

- [ ] Add /ishere details {id} slack command that returns detailed infromation about link (such as ID, namespace, ttl etc)
- [ ] Create proper readme
- [ ] Fix all TODOs in code
- [ ] Go through `wrangler.jsonc`, and update all database and KV IDs
- [ ] Consider alternative error format than the default used by zod
- [x] Add non-API routes /:id, /:namespace/:shortPath and */qr variations
- [x] Do we really want to use `Authorization: api-key: {api-key}` or should we just use a simple header, like `X-API-KEY` or `Authorization` straight up (related: consider using apiKey or apiToken consistently)
- [x] Add expiration to LinkSchema
- [x] Consider adding a `expiresAt` field to `LinkKVSchema` that's calculated from `exirationTtl`

__New features__
- [ ] Consider adding support for a webhook each time a link is resolved
- [ ] Consider adding support for listing links under specific namespace, e.g all links `/something/*`
- [ ] Consider adding `isBot` property, https://github.com/omrilotan/isbot
- [ ] Consider caching a cache miss (as per discussion with Teo)

__Done__
- [x] Granular auth middlware, now it's for the all /api/link*
- [x] Add X-API-KEY auth header for backward compat


## Development Setup

```
npm install
npm run generate-types
cp .dev.vars.template .dev.vars
```

__Setup databases__

KV
```
npx wrangler kv namespace create ishere
```

D1 SQL database
```
npx wrangler d1 create ishere
npx wrangler d1 execute ishere --local --file=./migrations/0000_initial.sql
```

__TODO__:
- [ ] Create local d1 database and run migrations
- [ ] Create local KV (is this needed?)
