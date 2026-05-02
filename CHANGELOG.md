[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.9...v0.1.10)

### 🐛 Bug Fixes

- make httx packages publishable ([f58928d](https://github.com/stacksjs/ts-http/commit/f58928d)) _(by Chris <chrisbreuer93@gmail.com>)_

### 🧹 Chores

- release v0.1.10 ([d1a3331](https://github.com/stacksjs/ts-http/commit/d1a3331)) _(by Chris <chrisbreuer93@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.9...HEAD)

### 🐛 Bug Fixes

- make httx packages publishable ([f58928d](https://github.com/stacksjs/ts-http/commit/f58928d)) _(by Chris <chrisbreuer93@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.8...v0.1.9)

### 🧹 Chores

- release v0.1.9 ([15b4825](https://github.com/stacksjs/ts-http/commit/15b4825)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([4f97daa](https://github.com/stacksjs/ts-http/commit/4f97daa)) _(by Chris <chrisbreuer93@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.8...HEAD)

### 🧹 Chores

- wip ([4f97daa](https://github.com/stacksjs/ts-http/commit/4f97daa)) _(by Chris <chrisbreuer93@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.7...v0.1.8)

### 🚀 Features

- **httx**: per-host circuit breaker + convenience verb methods ([b286332](https://github.com/stacksjs/ts-http/commit/b286332)) _(by Chris <chrisbreuer93@gmail.com>)_
- add useHead page titles across all devtools pages ([ee1e2c9](https://github.com/stacksjs/ts-http/commit/ee1e2c9)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use file-based dynamic routes for detail pages ([b5da09c](https://github.com/stacksjs/ts-http/commit/b5da09c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add StxLink, WebSocket broadcasting, real-time updates ([128ad97](https://github.com/stacksjs/ts-http/commit/128ad97)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add CLI, WebSocket broadcasting, and fix routing ([94043da](https://github.com/stacksjs/ts-http/commit/94043da)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add trackRequests() global fetch patch and ingest API endpoint ([5c32c90](https://github.com/stacksjs/ts-http/commit/5c32c90)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add DynamoDB storage layer and onRequestComplete hook ([ef8b8c9](https://github.com/stacksjs/ts-http/commit/ef8b8c9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### 🐛 Bug Fixes

- resolve lint errors ([00f3360](https://github.com/stacksjs/ts-http/commit/00f3360)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- make store exports callable (Pinia composable pattern) ([88778df](https://github.com/stacksjs/ts-http/commit/88778df)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- scan partials and components in crosswind config ([fbf2d49](https://github.com/stacksjs/ts-http/commit/fbf2d49)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- convert all server-side directives to client-side for reactive data ([4601470](https://github.com/stacksjs/ts-http/commit/4601470)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- restructure devtools to root-level dirs and fix monitoring page ([bb274c3](https://github.com/stacksjs/ts-http/commit/bb274c3)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- resolve typecheck errors ([56f9c0d](https://github.com/stacksjs/ts-http/commit/56f9c0d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- resolve typecheck errors ([a2a07df](https://github.com/stacksjs/ts-http/commit/a2a07df)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use useRef for canvas/D3 elements, fix SPA nav highlighting ([1783d77](https://github.com/stacksjs/ts-http/commit/1783d77)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### ♻️ Code Refactoring

- replace inline useQuery with shared stores ([fb104b8](https://github.com/stacksjs/ts-http/commit/fb104b8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use typed defineProps in EmptyState component ([17872ca](https://github.com/stacksjs/ts-http/commit/17872ca)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove unnecessary <script server> from EmptyState component ([6c38ebf](https://github.com/stacksjs/ts-http/commit/6c38ebf)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- extract shared logic into functions/ and stores/ ([c62892d](https://github.com/stacksjs/ts-http/commit/c62892d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove hand-rolled stx rendering — use serve() from stx ([cecc3fd](https://github.com/stacksjs/ts-http/commit/cecc3fd)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- replace all manual data-stx-link with StxLink :to ([4a20c28](https://github.com/stacksjs/ts-http/commit/4a20c28)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- replace data-stx-link with StxLink component ([a5e0b64](https://github.com/stacksjs/ts-http/commit/a5e0b64)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- move router config to stx.config.ts ([b2a7b8e](https://github.com/stacksjs/ts-http/commit/b2a7b8e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove HTML boilerplate from layouts — use auto-shell ([754cefc](https://github.com/stacksjs/ts-http/commit/754cefc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- extract shared UI helpers into utils.ts ([bc0d0e8](https://github.com/stacksjs/ts-http/commit/bc0d0e8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- clean up devtools index.ts and update STX page templates ([e86e585](https://github.com/stacksjs/ts-http/commit/e86e585)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- swap DynamoDB for SQLite, add null guards ([67cd06c](https://github.com/stacksjs/ts-http/commit/67cd06c)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### 🧹 Chores

- release v0.1.8 ([134855c](https://github.com/stacksjs/ts-http/commit/134855c)) _(by Chris <chrisbreuer93@gmail.com>)_
- refresh bun.lock and apply pickier --fix ([0f086ee](https://github.com/stacksjs/ts-http/commit/0f086ee)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock ([496f6f8](https://github.com/stacksjs/ts-http/commit/496f6f8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- lint:fix ([2cf60da](https://github.com/stacksjs/ts-http/commit/2cf60da)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock to pick up latest pickier ([ad921b2](https://github.com/stacksjs/ts-http/commit/ad921b2)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up dtsx 0.9.14 and bunfig 0.15.9 ([59a0e32](https://github.com/stacksjs/ts-http/commit/59a0e32)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([c7bfb87](https://github.com/stacksjs/ts-http/commit/c7bfb87)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up pickier 0.1.21 ([b34c8a5](https://github.com/stacksjs/ts-http/commit/b34c8a5)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([0274628](https://github.com/stacksjs/ts-http/commit/0274628)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- auto-fix lint errors ([d1bc201](https://github.com/stacksjs/ts-http/commit/d1bc201)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- gitignore .stx directory ([16424cc](https://github.com/stacksjs/ts-http/commit/16424cc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- include md in pickier lint extensions ([ff73e56](https://github.com/stacksjs/ts-http/commit/ff73e56)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([865a6ee](https://github.com/stacksjs/ts-http/commit/865a6ee)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add css config path to stx.config.ts ([b7ddbef](https://github.com/stacksjs/ts-http/commit/b7ddbef)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add stx runtime type declarations ([3c1d451](https://github.com/stacksjs/ts-http/commit/3c1d451)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove stale stx-router-inline partial ([5687b32](https://github.com/stacksjs/ts-http/commit/5687b32)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([e0eefc5](https://github.com/stacksjs/ts-http/commit/e0eefc5)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update vscode config ([b834110](https://github.com/stacksjs/ts-http/commit/b834110)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update dependencies ([8047c28](https://github.com/stacksjs/ts-http/commit/8047c28)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e0beb49](https://github.com/stacksjs/ts-http/commit/e0beb49)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([2136188](https://github.com/stacksjs/ts-http/commit/2136188)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- repo cleanup and modernization ([3b499ba](https://github.com/stacksjs/ts-http/commit/3b499ba)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove @stacksjs/docs ([58e5a4a](https://github.com/stacksjs/ts-http/commit/58e5a4a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove .zed and .cursor folders ([fca8d61](https://github.com/stacksjs/ts-http/commit/fca8d61)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove redundant docs/.vitepress ([59dbdfc](https://github.com/stacksjs/ts-http/commit/59dbdfc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update better-dx to ^0.2.7 ([0e4fd10](https://github.com/stacksjs/ts-http/commit/0e4fd10)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update CLAUDE.md with project context and crosswind details ([2700078](https://github.com/stacksjs/ts-http/commit/2700078)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add proper claude code guidelines ([e9a677f](https://github.com/stacksjs/ts-http/commit/e9a677f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use pantry monorepo action instead of pantry-setup ([94fbe23](https://github.com/stacksjs/ts-http/commit/94fbe23)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa7394b](https://github.com/stacksjs/ts-http/commit/aa7394b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update CI action versions and fix bun.lock hash ([40c582d](https://github.com/stacksjs/ts-http/commit/40c582d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b1a0f09](https://github.com/stacksjs/ts-http/commit/b1a0f09)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([32c7e2d](https://github.com/stacksjs/ts-http/commit/32c7e2d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd4d92c](https://github.com/stacksjs/ts-http/commit/dd4d92c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([0db030e](https://github.com/stacksjs/ts-http/commit/0db030e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9f4e797](https://github.com/stacksjs/ts-http/commit/9f4e797)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([79e220d](https://github.com/stacksjs/ts-http/commit/79e220d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd1870d](https://github.com/stacksjs/ts-http/commit/dd1870d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([365809d](https://github.com/stacksjs/ts-http/commit/365809d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([bd74c54](https://github.com/stacksjs/ts-http/commit/bd74c54)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([f86d398](https://github.com/stacksjs/ts-http/commit/f86d398)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([26d400a](https://github.com/stacksjs/ts-http/commit/26d400a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c880cc7](https://github.com/stacksjs/ts-http/commit/c880cc7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([7a90546](https://github.com/stacksjs/ts-http/commit/7a90546)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([f8fb487](https://github.com/stacksjs/ts-http/commit/f8fb487)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([92cfcc4](https://github.com/stacksjs/ts-http/commit/92cfcc4)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency actions/checkout to v6.0.2 (#1755) ([c8923b7](https://github.com/stacksjs/ts-http/commit/c8923b7)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#1755](https://github.com/stacksjs/ts-http/issues/1755), [#1755](https://github.com/stacksjs/ts-http/issues/1755))

### Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.7...HEAD)

### 🚀 Features

- **httx**: per-host circuit breaker + convenience verb methods ([b286332](https://github.com/stacksjs/ts-http/commit/b286332)) _(by Chris <chrisbreuer93@gmail.com>)_
- add useHead page titles across all devtools pages ([ee1e2c9](https://github.com/stacksjs/ts-http/commit/ee1e2c9)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use file-based dynamic routes for detail pages ([b5da09c](https://github.com/stacksjs/ts-http/commit/b5da09c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add StxLink, WebSocket broadcasting, real-time updates ([128ad97](https://github.com/stacksjs/ts-http/commit/128ad97)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add CLI, WebSocket broadcasting, and fix routing ([94043da](https://github.com/stacksjs/ts-http/commit/94043da)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add trackRequests() global fetch patch and ingest API endpoint ([5c32c90](https://github.com/stacksjs/ts-http/commit/5c32c90)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add DynamoDB storage layer and onRequestComplete hook ([ef8b8c9](https://github.com/stacksjs/ts-http/commit/ef8b8c9)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### 🐛 Bug Fixes

- resolve lint errors ([00f3360](https://github.com/stacksjs/ts-http/commit/00f3360)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- make store exports callable (Pinia composable pattern) ([88778df](https://github.com/stacksjs/ts-http/commit/88778df)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- scan partials and components in crosswind config ([fbf2d49](https://github.com/stacksjs/ts-http/commit/fbf2d49)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- convert all server-side directives to client-side for reactive data ([4601470](https://github.com/stacksjs/ts-http/commit/4601470)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- restructure devtools to root-level dirs and fix monitoring page ([bb274c3](https://github.com/stacksjs/ts-http/commit/bb274c3)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- resolve typecheck errors ([56f9c0d](https://github.com/stacksjs/ts-http/commit/56f9c0d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- resolve typecheck errors ([a2a07df](https://github.com/stacksjs/ts-http/commit/a2a07df)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use useRef for canvas/D3 elements, fix SPA nav highlighting ([1783d77](https://github.com/stacksjs/ts-http/commit/1783d77)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### ♻️ Code Refactoring

- replace inline useQuery with shared stores ([fb104b8](https://github.com/stacksjs/ts-http/commit/fb104b8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use typed defineProps in EmptyState component ([17872ca](https://github.com/stacksjs/ts-http/commit/17872ca)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove unnecessary <script server> from EmptyState component ([6c38ebf](https://github.com/stacksjs/ts-http/commit/6c38ebf)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- extract shared logic into functions/ and stores/ ([c62892d](https://github.com/stacksjs/ts-http/commit/c62892d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove hand-rolled stx rendering — use serve() from stx ([cecc3fd](https://github.com/stacksjs/ts-http/commit/cecc3fd)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- replace all manual data-stx-link with StxLink :to ([4a20c28](https://github.com/stacksjs/ts-http/commit/4a20c28)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- replace data-stx-link with StxLink component ([a5e0b64](https://github.com/stacksjs/ts-http/commit/a5e0b64)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- move router config to stx.config.ts ([b2a7b8e](https://github.com/stacksjs/ts-http/commit/b2a7b8e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove HTML boilerplate from layouts — use auto-shell ([754cefc](https://github.com/stacksjs/ts-http/commit/754cefc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- extract shared UI helpers into utils.ts ([bc0d0e8](https://github.com/stacksjs/ts-http/commit/bc0d0e8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- clean up devtools index.ts and update STX page templates ([e86e585](https://github.com/stacksjs/ts-http/commit/e86e585)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- swap DynamoDB for SQLite, add null guards ([67cd06c](https://github.com/stacksjs/ts-http/commit/67cd06c)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### 🧹 Chores

- refresh bun.lock and apply pickier --fix ([0f086ee](https://github.com/stacksjs/ts-http/commit/0f086ee)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock ([496f6f8](https://github.com/stacksjs/ts-http/commit/496f6f8)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- lint:fix ([2cf60da](https://github.com/stacksjs/ts-http/commit/2cf60da)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- refresh bun.lock to pick up latest pickier ([ad921b2](https://github.com/stacksjs/ts-http/commit/ad921b2)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up dtsx 0.9.14 and bunfig 0.15.9 ([59a0e32](https://github.com/stacksjs/ts-http/commit/59a0e32)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([c7bfb87](https://github.com/stacksjs/ts-http/commit/c7bfb87)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fresh install to pick up pickier 0.1.21 ([b34c8a5](https://github.com/stacksjs/ts-http/commit/b34c8a5)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([0274628](https://github.com/stacksjs/ts-http/commit/0274628)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- auto-fix lint errors ([d1bc201](https://github.com/stacksjs/ts-http/commit/d1bc201)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- gitignore .stx directory ([16424cc](https://github.com/stacksjs/ts-http/commit/16424cc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- include md in pickier lint extensions ([ff73e56](https://github.com/stacksjs/ts-http/commit/ff73e56)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([865a6ee](https://github.com/stacksjs/ts-http/commit/865a6ee)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add css config path to stx.config.ts ([b7ddbef](https://github.com/stacksjs/ts-http/commit/b7ddbef)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add stx runtime type declarations ([3c1d451](https://github.com/stacksjs/ts-http/commit/3c1d451)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove stale stx-router-inline partial ([5687b32](https://github.com/stacksjs/ts-http/commit/5687b32)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- minor updates ([e0eefc5](https://github.com/stacksjs/ts-http/commit/e0eefc5)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update vscode config ([b834110](https://github.com/stacksjs/ts-http/commit/b834110)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update dependencies ([8047c28](https://github.com/stacksjs/ts-http/commit/8047c28)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([e0beb49](https://github.com/stacksjs/ts-http/commit/e0beb49)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- fix lint errors ([2136188](https://github.com/stacksjs/ts-http/commit/2136188)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- repo cleanup and modernization ([3b499ba](https://github.com/stacksjs/ts-http/commit/3b499ba)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove @stacksjs/docs ([58e5a4a](https://github.com/stacksjs/ts-http/commit/58e5a4a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove .zed and .cursor folders ([fca8d61](https://github.com/stacksjs/ts-http/commit/fca8d61)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- remove redundant docs/.vitepress ([59dbdfc](https://github.com/stacksjs/ts-http/commit/59dbdfc)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update better-dx to ^0.2.7 ([0e4fd10](https://github.com/stacksjs/ts-http/commit/0e4fd10)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update CLAUDE.md with project context and crosswind details ([2700078](https://github.com/stacksjs/ts-http/commit/2700078)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- add proper claude code guidelines ([e9a677f](https://github.com/stacksjs/ts-http/commit/e9a677f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- use pantry monorepo action instead of pantry-setup ([94fbe23](https://github.com/stacksjs/ts-http/commit/94fbe23)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([aa7394b](https://github.com/stacksjs/ts-http/commit/aa7394b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- update CI action versions and fix bun.lock hash ([40c582d](https://github.com/stacksjs/ts-http/commit/40c582d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([b1a0f09](https://github.com/stacksjs/ts-http/commit/b1a0f09)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([32c7e2d](https://github.com/stacksjs/ts-http/commit/32c7e2d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd4d92c](https://github.com/stacksjs/ts-http/commit/dd4d92c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([0db030e](https://github.com/stacksjs/ts-http/commit/0db030e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([9f4e797](https://github.com/stacksjs/ts-http/commit/9f4e797)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([79e220d](https://github.com/stacksjs/ts-http/commit/79e220d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd1870d](https://github.com/stacksjs/ts-http/commit/dd1870d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([365809d](https://github.com/stacksjs/ts-http/commit/365809d)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([bd74c54](https://github.com/stacksjs/ts-http/commit/bd74c54)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([f86d398](https://github.com/stacksjs/ts-http/commit/f86d398)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([26d400a](https://github.com/stacksjs/ts-http/commit/26d400a)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([c880cc7](https://github.com/stacksjs/ts-http/commit/c880cc7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([7a90546](https://github.com/stacksjs/ts-http/commit/7a90546)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([f8fb487](https://github.com/stacksjs/ts-http/commit/f8fb487)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([92cfcc4](https://github.com/stacksjs/ts-http/commit/92cfcc4)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency actions/checkout to v6.0.2 (#1755) ([c8923b7](https://github.com/stacksjs/ts-http/commit/c8923b7)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#1755](https://github.com/stacksjs/ts-http/issues/1755), [#1755](https://github.com/stacksjs/ts-http/issues/1755))

### Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.6...v0.1.7)

### 🧹 Chores

- release v0.1.7 ([5748352](https://github.com/stacksjs/ts-http/commit/5748352)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.5...v0.1.6)

### 🧹 Chores

- release v0.1.6 ([1d04eef](https://github.com/stacksjs/ts-http/commit/1d04eef)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([323a424](https://github.com/stacksjs/ts-http/commit/323a424)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5f57b2f](https://github.com/stacksjs/ts-http/commit/5f57b2f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([69e4fe4](https://github.com/stacksjs/ts-http/commit/69e4fe4)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([2984232](https://github.com/stacksjs/ts-http/commit/2984232)) _(by Chris <chrisbreuer93@gmail.com>)_
- update cover and og-image ([2e881a0](https://github.com/stacksjs/ts-http/commit/2e881a0)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#29) ([500d20d](https://github.com/stacksjs/ts-http/commit/500d20d)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#29](https://github.com/stacksjs/ts-http/issues/29), [#29](https://github.com/stacksjs/ts-http/issues/29))
- wip ([1efc215](https://github.com/stacksjs/ts-http/commit/1efc215)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([0c3fdc7](https://github.com/stacksjs/ts-http/commit/0c3fdc7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd7fc88](https://github.com/stacksjs/ts-http/commit/dd7fc88)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency actions/checkout to v5.0.0 (#25) ([7bf709b](https://github.com/stacksjs/ts-http/commit/7bf709b)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#25](https://github.com/stacksjs/ts-http/issues/25), [#25](https://github.com/stacksjs/ts-http/issues/25))
- **deps**: update dependency better-dx to ^0.2.3 (#27) ([30b73b0](https://github.com/stacksjs/ts-http/commit/30b73b0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#27](https://github.com/stacksjs/ts-http/issues/27), [#27](https://github.com/stacksjs/ts-http/issues/27))
- wip ([19cc92a](https://github.com/stacksjs/ts-http/commit/19cc92a)) _(by Chris <chrisbreuer93@gmail.com>)_
- use launchpad ([54fcc37](https://github.com/stacksjs/ts-http/commit/54fcc37)) _(by Chris <chrisbreuer93@gmail.com>)_
- add clarity for improve logging ([ba1c4c1](https://github.com/stacksjs/ts-http/commit/ba1c4c1)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update dependency actions/checkout to v5.0.0 (#19) ([9349347](https://github.com/stacksjs/ts-http/commit/9349347)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#19](https://github.com/stacksjs/ts-http/issues/19), [#19](https://github.com/stacksjs/ts-http/issues/19))
- **deps**: update dependency @stacksjs/eslint-config to 4.14.0-beta.3 (#18) ([03d2445](https://github.com/stacksjs/ts-http/commit/03d2445)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#18](https://github.com/stacksjs/ts-http/issues/18), [#18](https://github.com/stacksjs/ts-http/issues/18))
- **deps**: update all non-major dependencies (#16) ([ab91c85](https://github.com/stacksjs/ts-http/commit/ab91c85)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#16](https://github.com/stacksjs/ts-http/issues/16), [#16](https://github.com/stacksjs/ts-http/issues/16))
- update tooling ([fcb8db3](https://github.com/stacksjs/ts-http/commit/fcb8db3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- improve documentation and add bun-git-hooks ([283384c](https://github.com/stacksjs/ts-http/commit/283384c)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#14) ([6aa2eaa](https://github.com/stacksjs/ts-http/commit/6aa2eaa)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#14](https://github.com/stacksjs/ts-http/issues/14), [#14](https://github.com/stacksjs/ts-http/issues/14))
- build changes and stargazers ([2c7ebe9](https://github.com/stacksjs/ts-http/commit/2c7ebe9)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#11) ([00f9613](https://github.com/stacksjs/ts-http/commit/00f9613)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/ts-http/issues/11), [#11](https://github.com/stacksjs/ts-http/issues/11))
- **deps**: update dependency unocss to v66 (#13) ([e0e5f74](https://github.com/stacksjs/ts-http/commit/e0e5f74)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/ts-http/issues/13), [#13](https://github.com/stacksjs/ts-http/issues/13))
- add cursor rules and add stacks docs ([e322680](https://github.com/stacksjs/ts-http/commit/e322680)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#10) ([7d86ca1](https://github.com/stacksjs/ts-http/commit/7d86ca1)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#10](https://github.com/stacksjs/ts-http/issues/10), [#10](https://github.com/stacksjs/ts-http/issues/10))
- **deps**: update all non-major dependencies (#9) ([67ef7be](https://github.com/stacksjs/ts-http/commit/67ef7be)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#9](https://github.com/stacksjs/ts-http/issues/9), [#9](https://github.com/stacksjs/ts-http/issues/9))
- adjust wording ([6b34541](https://github.com/stacksjs/ts-http/commit/6b34541)) _(by Chris <chrisbreuer93@gmail.com>)_
- enhance funding.yml ([d288aad](https://github.com/stacksjs/ts-http/commit/d288aad)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- add github funding info ([2b598c4](https://github.com/stacksjs/ts-http/commit/2b598c4)) _(by Chris <chrisbreuer93@gmail.com>)_
- move screenshot position ([731095e](https://github.com/stacksjs/ts-http/commit/731095e)) _(by Chris <chrisbreuer93@gmail.com>)_
- add screenshot into readme ([0101a48](https://github.com/stacksjs/ts-http/commit/0101a48)) _(by Chris <chrisbreuer93@gmail.com>)_
- add `httpie` credits ([e73a14b](https://github.com/stacksjs/ts-http/commit/e73a14b)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Merge pull request #15 from stacksjs/renovate/all-minor-patch ([a28e2bb](https://github.com/stacksjs/ts-http/commit/a28e2bb)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#15](https://github.com/stacksjs/ts-http/issues/15), [#15](https://github.com/stacksjs/ts-http/issues/15))

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _cab-mikee <mike.cabz32@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-http/compare/v0.1.5...HEAD)

### 🧹 Chores

- wip ([323a424](https://github.com/stacksjs/ts-http/commit/323a424)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([5f57b2f](https://github.com/stacksjs/ts-http/commit/5f57b2f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([69e4fe4](https://github.com/stacksjs/ts-http/commit/69e4fe4)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([2984232](https://github.com/stacksjs/ts-http/commit/2984232)) _(by Chris <chrisbreuer93@gmail.com>)_
- update cover and og-image ([2e881a0](https://github.com/stacksjs/ts-http/commit/2e881a0)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#29) ([500d20d](https://github.com/stacksjs/ts-http/commit/500d20d)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#29](https://github.com/stacksjs/ts-http/issues/29), [#29](https://github.com/stacksjs/ts-http/issues/29))
- wip ([1efc215](https://github.com/stacksjs/ts-http/commit/1efc215)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([0c3fdc7](https://github.com/stacksjs/ts-http/commit/0c3fdc7)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([dd7fc88](https://github.com/stacksjs/ts-http/commit/dd7fc88)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: update dependency actions/checkout to v5.0.0 (#25) ([7bf709b](https://github.com/stacksjs/ts-http/commit/7bf709b)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#25](https://github.com/stacksjs/ts-http/issues/25), [#25](https://github.com/stacksjs/ts-http/issues/25))
- **deps**: update dependency better-dx to ^0.2.3 (#27) ([30b73b0](https://github.com/stacksjs/ts-http/commit/30b73b0)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#27](https://github.com/stacksjs/ts-http/issues/27), [#27](https://github.com/stacksjs/ts-http/issues/27))
- wip ([19cc92a](https://github.com/stacksjs/ts-http/commit/19cc92a)) _(by Chris <chrisbreuer93@gmail.com>)_
- use launchpad ([54fcc37](https://github.com/stacksjs/ts-http/commit/54fcc37)) _(by Chris <chrisbreuer93@gmail.com>)_
- add clarity for improve logging ([ba1c4c1](https://github.com/stacksjs/ts-http/commit/ba1c4c1)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update dependency actions/checkout to v5.0.0 (#19) ([9349347](https://github.com/stacksjs/ts-http/commit/9349347)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#19](https://github.com/stacksjs/ts-http/issues/19), [#19](https://github.com/stacksjs/ts-http/issues/19))
- **deps**: update dependency @stacksjs/eslint-config to 4.14.0-beta.3 (#18) ([03d2445](https://github.com/stacksjs/ts-http/commit/03d2445)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#18](https://github.com/stacksjs/ts-http/issues/18), [#18](https://github.com/stacksjs/ts-http/issues/18))
- **deps**: update all non-major dependencies (#16) ([ab91c85](https://github.com/stacksjs/ts-http/commit/ab91c85)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#16](https://github.com/stacksjs/ts-http/issues/16), [#16](https://github.com/stacksjs/ts-http/issues/16))
- update tooling ([fcb8db3](https://github.com/stacksjs/ts-http/commit/fcb8db3)) _(by Adelino Ngomacha <adelinob335@gmail.com>)_
- improve documentation and add bun-git-hooks ([283384c](https://github.com/stacksjs/ts-http/commit/283384c)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#14) ([6aa2eaa](https://github.com/stacksjs/ts-http/commit/6aa2eaa)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#14](https://github.com/stacksjs/ts-http/issues/14), [#14](https://github.com/stacksjs/ts-http/issues/14))
- build changes and stargazers ([2c7ebe9](https://github.com/stacksjs/ts-http/commit/2c7ebe9)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#11) ([00f9613](https://github.com/stacksjs/ts-http/commit/00f9613)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#11](https://github.com/stacksjs/ts-http/issues/11), [#11](https://github.com/stacksjs/ts-http/issues/11))
- **deps**: update dependency unocss to v66 (#13) ([e0e5f74](https://github.com/stacksjs/ts-http/commit/e0e5f74)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#13](https://github.com/stacksjs/ts-http/issues/13), [#13](https://github.com/stacksjs/ts-http/issues/13))
- add cursor rules and add stacks docs ([e322680](https://github.com/stacksjs/ts-http/commit/e322680)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- **deps**: update all non-major dependencies (#10) ([7d86ca1](https://github.com/stacksjs/ts-http/commit/7d86ca1)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#10](https://github.com/stacksjs/ts-http/issues/10), [#10](https://github.com/stacksjs/ts-http/issues/10))
- **deps**: update all non-major dependencies (#9) ([67ef7be](https://github.com/stacksjs/ts-http/commit/67ef7be)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#9](https://github.com/stacksjs/ts-http/issues/9), [#9](https://github.com/stacksjs/ts-http/issues/9))
- adjust wording ([6b34541](https://github.com/stacksjs/ts-http/commit/6b34541)) _(by Chris <chrisbreuer93@gmail.com>)_
- enhance funding.yml ([d288aad](https://github.com/stacksjs/ts-http/commit/d288aad)) _(by cab-mikee <mike.cabz32@gmail.com>)_
- add github funding info ([2b598c4](https://github.com/stacksjs/ts-http/commit/2b598c4)) _(by Chris <chrisbreuer93@gmail.com>)_
- move screenshot position ([731095e](https://github.com/stacksjs/ts-http/commit/731095e)) _(by Chris <chrisbreuer93@gmail.com>)_
- add screenshot into readme ([0101a48](https://github.com/stacksjs/ts-http/commit/0101a48)) _(by Chris <chrisbreuer93@gmail.com>)_
- add `httpie` credits ([e73a14b](https://github.com/stacksjs/ts-http/commit/e73a14b)) _(by Chris <chrisbreuer93@gmail.com>)_

### 📄 Miscellaneous

- Merge pull request #15 from stacksjs/renovate/all-minor-patch ([a28e2bb](https://github.com/stacksjs/ts-http/commit/a28e2bb)) _(by [renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot]))_ ([#15](https://github.com/stacksjs/ts-http/issues/15), [#15](https://github.com/stacksjs/ts-http/issues/15))

### Contributors

- _Adelino Ngomacha <adelinob335@gmail.com>_
- _Chris <chrisbreuer93@gmail.com>_
- _[renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>](https://github.com/renovate[bot])_
- _cab-mikee <mike.cabz32@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

## v0.1.4...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.4...main)

### 🩹 Fixes

- **ci:** Adjust binary name in workflow ([6933ba6](https://github.com/stacksjs/httx/commit/6933ba6))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## v0.1.3...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.3...main)

### 🏡 Chore

- Lint ([e855f8c](https://github.com/stacksjs/httx/commit/e855f8c))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## v0.1.2...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.2...main)

### 📖 Documentation

- Adjust hero ([9cdd570](https://github.com/stacksjs/httx/commit/9cdd570))

### 🏡 Chore

- Add bumpp to dev deps ([0f98e08](https://github.com/stacksjs/httx/commit/0f98e08))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## v0.1.2...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.2...main)

### 📖 Documentation

- Adjust hero ([9cdd570](https://github.com/stacksjs/httx/commit/9cdd570))

### 🏡 Chore

- Add bumpp to dev deps ([0f98e08](https://github.com/stacksjs/httx/commit/0f98e08))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## v0.1.1...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.1...main)

### 🏡 Chore

- Rename package ([36012f6](https://github.com/stacksjs/httx/commit/36012f6))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## v0.1.0...main

[compare changes](https://github.com/stacksjs/httx/compare/v0.1.0...main)

### 🏡 Chore

- Wip ([edea9d3](https://github.com/stacksjs/httx/commit/edea9d3))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))

## ...main

### 🏡 Chore

- Initial commit ([b3f7496](https://github.com/stacksjs/httx/commit/b3f7496))
- Wip ([94ae26e](https://github.com/stacksjs/httx/commit/94ae26e))
- Wip ([a06bc34](https://github.com/stacksjs/httx/commit/a06bc34))
- Wip ([b6d43cf](https://github.com/stacksjs/httx/commit/b6d43cf))
- Wip ([c4c6176](https://github.com/stacksjs/httx/commit/c4c6176))
- Wip ([7a37543](https://github.com/stacksjs/httx/commit/7a37543))
- Wip ([07791d5](https://github.com/stacksjs/httx/commit/07791d5))
- Wip ([a4fa57e](https://github.com/stacksjs/httx/commit/a4fa57e))
- Wip ([c9ceb70](https://github.com/stacksjs/httx/commit/c9ceb70))
- Wip ([afa3346](https://github.com/stacksjs/httx/commit/afa3346))
- Wip ([cad46c5](https://github.com/stacksjs/httx/commit/cad46c5))
- Wip ([8833b6e](https://github.com/stacksjs/httx/commit/8833b6e))
- Wip ([e7d53c9](https://github.com/stacksjs/httx/commit/e7d53c9))
- Wip ([57b0eec](https://github.com/stacksjs/httx/commit/57b0eec))
- Wip ([1b87c90](https://github.com/stacksjs/httx/commit/1b87c90))
- Wip ([293b985](https://github.com/stacksjs/httx/commit/293b985))

### ❤️ Contributors

- Chris ([@chrisbbreuer](http://github.com/chrisbbreuer))
