# Draft: Migrating poi to Babel 8

Status: Phase 0 and Phase 1 complete (2026-07-16) — poi now runs on Babel 8
Last updated: 2026-07-16

## Background

Babel 8.0.0 stable was released on 2026-06-16. Babel 7.29 (which poi is on) is the
final Babel 7 minor; it will receive security fixes only, until June 2027. So the
migration is not urgent, but the clock is running.

Key upstream facts:

- Babel 8 packages are **ESM-only**, consumable from CommonJS via Node's
  `require(esm)`.
- Engines: `node ^22.18.0 || >=24.11.0`. This applies everywhere Babel _runs_, which
  for poi includes **inside Electron at runtime** (see below).
- Babel 7 → 8 is designed to be a small upgrade: most breaking changes were already
  available as options in Babel 7.

## Where poi runs Babel

Unlike a typical webpack app, poi runs Babel in four distinct places; all must work:

| Context                                                                                               | Entry point                                                                                               | Node runtime                                                                          |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| App runtime (main + renderer), on-the-fly compile of `.es/.ts/.tsx` incl. **third-party poi plugins** | `index.js`, `views/env.ts`, `assets/js/plugin-preload.js`, `content/merge-content.js` → `@babel/register` | Electron's bundled Node (Electron 43 = Node 24.17 ✅)                                 |
| Build scripts                                                                                         | `gulpfile.js` → `@babel/register`; `build/compile-to-js.es` → `transformFile` from `@babel/core`          | System Node (CI `.node-version` = `22`, resolves ≥22.18 ✅; local dev must be ≥22.18) |
| Tests                                                                                                 | `babel-jest` (Jest 30)                                                                                    | System Node                                                                           |
| Lint                                                                                                  | `@babel/eslint-parser` for `.js`/`.es` files                                                              | System Node                                                                           |

The `babel.config.js` `overrides` block also compiles files _outside_ the repo root
(installed poi plugins), so config decisions affect the plugin ecosystem, not just
this repo.

## Dependency changes

| Package                                                                                                                          | From                         | To                                          | Notes                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`, `@babel/register`, `@babel/eslint-parser` | `^7.x`                       | `^8.0.1`                                    | `@babel/eslint-parser@8` requires ESLint ^9 or ^10 — we're on 10 ✅                                                                                                              |
| `@babel/plugin-proposal-decorators`                                                                                              | `^7.x`                       | `^8.0.2`                                    | Only `legacy` and `2023-11` versions remain; we use `legacy` ✅                                                                                                                  |
| `@babel/plugin-proposal-do-expressions`, `-export-default-from`, `-function-bind`, `-function-sent`, `-throw-expressions`        | `^7.x`                       | `^8.0.1`                                    | All republished for Babel 8 (peer `@babel/core ^8`)                                                                                                                              |
| `@babel/plugin-proposal-pipeline-operator`                                                                                       | `^7.x` (proposal: `minimal`) | ✅ **dropped in Phase 0**                   | Babel 8 only supports `fsharp` and `hack`; `minimal` was removed. No in-repo usage of `\|>`.                                                                                     |
| `babel-jest` / `jest`                                                                                                            | `^30.3.0`                    | `^30.4.1`                                   | babel-jest 30.4.1 widened its peer to `@babel/core ^7.11 \|\| ^8.0.0-0` ✅                                                                                                       |
| `babel-plugin-styled-components`                                                                                                 | `^2.1.4`                     | ✅ `^2.3.0` + npm `overrides` + config shim | Declares peer `@babel/core ^7.0.0` and asserts version 7 at runtime; handled, verified byte-identical output.                                                                    |
| `babel-plugin-add-module-exports`                                                                                                | `^1.0.4`                     | ✅ unchanged                                | Verified working under Babel 8 (`module.exports = exports.default` still emitted).                                                                                               |
| `@babel/register`                                                                                                                | `^7.x`                       | ✅ **removed** → local `babel-hook.js`      | register 8's worker-thread architecture cannot run in Electron renderers. Replaced by `pirates` + `transformSync` (new direct deps: `pirates`, `@cspotcode/source-map-support`). |

## Config changes (`babel.config.js`)

```js
module.exports = {
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        targets: { electron: '43' }, // bump from 38 to actual runtime
        // `loose: true` REMOVED in Babel 8 → replaced by `assumptions` below
        exclude: ['transform-dynamic-import'],
      },
    ],
    [
      require.resolve('@babel/preset-react'),
      { runtime: 'classic' }, // Babel 8 default flips to 'automatic'; pin first
    ],
    require.resolve('@babel/preset-typescript'),
  ],
  // Babel-7-compatible equivalent of preset-env `loose: true` (available since 7.13).
  // This is the documented set from https://babeljs.io/docs/assumptions
  // plus `enumerableModuleMeta`: the docs' list omits it, but preset-env's loose
  // mode also switches transform-modules-commonjs to `exports.__esModule = true`;
  // without it the compiled output of every module changes. Verified by diffing
  // all 239 compiled files — with this set the output is byte-identical to loose.
  assumptions: {
    arrayLikeIsIterable: true,
    constantReexports: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    mutableTemplateObject: true,
    noClassCalls: true,
    noDocumentAll: true,
    objectRestNoSymbols: true,
    privateFieldsAsProperties: true,
    pureGetters: true,
    setClassMethods: true,
    setComputedProperties: true,
    setPublicClassFields: true,
    setSpreadProperties: true,
    skipForOfIteratorClosing: true,
    superIsCallableConstructor: true,
  },
  plugins: [
    require.resolve('babel-plugin-styled-components'),
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    // pipeline-operator: removed (was `minimal`, which Babel 8 dropped)
    // ...remaining proposal plugins unchanged
    // babel-plugin-add-module-exports: pending compatibility verdict
  ],
  // overrides / only / ignore: unchanged
}
```

Notes:

- **`loose: true` removal** is the only hard config break. The `assumptions` block
  above is the documented equivalent and works on Babel 7 too, so it can (and
  should) land _before_ the version bump. Alternative: audit whether we still need
  loose mode at all — targets are `electron 43`, so almost nothing is transpiled by
  preset-env anymore and most assumptions are moot. Dropping loose entirely may be
  the simpler, safer end state; needs an output diff to confirm.
- **JSX runtime**: Babel 8 defaults `preset-react` to `runtime: 'automatic'`
  (imports `react/jsx-runtime`). Pinning `'classic'` keeps output identical during
  the migration. Third-party plugins are compiled with this config, and `automatic`
  requires `react/jsx-runtime` to resolve from _plugin_ directories through
  `@babel/register`'s path patches — verify that separately before flipping.
- **preset-typescript**: `allowDeclareFields` now defaults to `true`; `isTSX` /
  `allExtensions` replaced by `ignoreExtensions`. We use none of these — no change.
- **preset-env targets**: Babel 8 defaults to `targets: "defaults"` (≈ES2023)
  instead of ES5-for-everything. We set an explicit Electron target, so unaffected.

## Decisions needed

1. ~~**Pipeline operator plugin.**~~ Resolved in Phase 0: dropped. poi's own code
   no longer uses `|>` (verified by grep); any third-party plugin still using
   `minimal`-style `|>` couldn't be compiled by Babel 8 anyway.
2. ~~**`babel-plugin-add-module-exports`.**~~ Resolved in Phase 1: verified
   working under Babel 8 unchanged (fixture with a lone `export default`
   requires correctly without `.default`).
3. **Decorators.** poi's own code no longer uses decorators, but legacy `@connect`
   decorators are common in older third-party plugins → keep
   `plugin-proposal-decorators` with `legacy: true` for plugin compat.
4. **Node floor for contributors.** Babel 8 makes Node <22.18 unable to even run
   `npm test`/`gulp`. Consider adding `engines` to `package.json` and bumping
   `.node-version` from `22` to `24` to match Electron 43's runtime.

## Risks

- **`require(esm)` interop at every `@babel/register` call site.** All five call
  sites do CJS `require('@babel/register')(config)`. Babel 8 publishes ESM-only;
  Node's `require(esm)` handles it on our supported Node versions, but the
  callable-default interop must be verified in Electron main, Electron renderer
  (`views/env.ts`), and plain Node (gulp) — not just one of them.
- **`build/compile-to-js.es`** imports `transformFile` from `@babel/core` and
  reuses `presets`/`plugins` from the config — verify named-export access via
  interop and that release builds (`gulp build`) produce working `.js` output.
- **Third-party poi plugins** are compiled by this config at install/load time.
  Any output change (JSX runtime, loose→assumptions drift, add-module-exports) has
  ecosystem blast radius. Smoke-test a representative set of plugins, ideally
  including at least one legacy `.es`-based plugin with decorators.
- **`babel-plugin-styled-components`** peer conflict blocks `npm install` under
  npm 11 until overridden; functional compat with Babel 8 is unverified upstream.

## Suggested phasing

**Phase 0 — land on Babel 7 first (no behavior risk):** ✅ done 2026-07-16

1. ✅ Replaced preset-env `loose: true` with the `assumptions` block above.
2. ✅ Pinned `runtime: 'classic'` in preset-react explicitly.
3. ✅ Bumped `targets.electron` from 38 to 43.
4. ✅ Removed `@babel/plugin-proposal-pipeline-operator` (config + dependency).
5. ✅ Fixed `build/compile-to-js.es` to thread `assumptions` through to
   `transformFile` — it destructures only `presets`/`plugins` from the config, so
   the release build would otherwise silently lose loose-mode behavior
   (`assumptions` is a top-level option, not a preset option).
6. ✅ Baseline verification:
   - Compiled all 239 `.es/.ts/.tsx` files under `views/`, `lib/`, `build/` with
     the old and new config — output is **byte-identical** (only source-level
     change is the compile-to-js.es edit itself).
   - `npm test`: 25 suites / 189 tests / 26 snapshots passed.
   - `npm run typecheck` and ESLint on the changed files: clean.
   - `@babel/register` smoke test in plain Node: compiles and requires an `.es`
     fixture outside the repo root (exercising the plugin `overrides` branch),
     default-export interop via add-module-exports intact.

**Phase 1 — the bump:** ✅ done 2026-07-16

1. ✅ Bumped all `@babel/*` to `^8`, `babel-jest`/`jest` to `^30.4.1`, added
   `engines.node` (`^22.18.0 || >=24.11.0`).
2. ✅ `babel-plugin-styled-components`: npm `overrides` align its `@babel/core`
   peer **and** its `@babel/plugin-syntax-jsx` dep to v8, plus a shim in
   `babel.config.js` that no-ops its `assertVersion(7)` and strips its
   `inherits: syntax-jsx` (see "What Phase 1 actually hit" below). Verified
   working: styled-components `.tsx` output is byte-identical to Babel 7,
   displayName annotations intact.
3. ✅ `babel-plugin-add-module-exports` **works under Babel 8 unchanged** —
   compiled output still ends with `module.exports = exports.default`, and the
   plugin-path `.es` fixture requires correctly without `.default`.
4. ✅ `@babel/register` **removed entirely**, replaced by `babel-hook.js` (see
   below — register 8 cannot work in Electron renderers).

### What Phase 1 actually hit (in the order the wall was met)

1. **`babel-plugin-styled-components` hard-rejects Babel 8** via
   `api.assertVersion(7)` even though it is functionally compatible. Solved with
   the shim + overrides described above; drop both when upstream ships Babel 8
   support.
2. **Decorators option renamed**: `{ legacy: true }` is rejected; Babel 8
   requires `{ version: 'legacy' }`.
3. **JSX parsing leaks into `.ts` files.** Babel 7's preset-typescript removed
   the JSX parser plugin for `.ts`; Babel 8 doesn't, so preset-react (or any
   `inherits: syntax-jsx`) makes generic arrows like `<T>(x: T) => x` parse
   errors. Fixed by (a) moving preset-react into a config `overrides` entry with
   `exclude: /\.ts$/`, and (b) stripping `inherits` from the styled-components
   shim (preset-react supplies JSX parsing everywhere it's legal).
4. **Babel 8's TS scope checking rejects `declare global { var x }` alongside a
   module-level `const x`** (tsc accepts it). Three files hit this; their
   `declare global` blocks moved to `lib/globals.d.ts` and
   `views/env-parts/globals.d.ts`, which Babel parses without collision.
5. **ESM→CJS no longer happens by default without caller info.** preset-env now
   needs explicit `modules: 'commonjs'` or `build/compile-to-js.es` (a bare
   `transformFile` caller) emits ESM into the CJS app. Also: `compile-to-js.es`
   destructured only `presets`/`plugins`, so `assumptions` and the new
   `overrides` (carrying preset-react) had to be threaded through.
6. **`require('@babel/register')` returns a namespace object** under
   `require(esm)` — call sites need `.default`. (Moot after item 7.)
7. **`@babel/register@8` is unusable in Electron renderers.** It compiles in a
   `node:worker_threads` worker unconditionally; (a) the options are
   structured-cloned, so function values in the config (shim, overrides `test`)
   throw `DataCloneError` — fixable by passing `configFile` as a path — but
   (b) Electron renderer processes cannot create Node workers at all ("The V8
   platform used by this instance of Node does not support creating Workers"),
   and `nodeIntegrationInWorker` does not change that. poi registers the hook in
   renderers (`views/env.ts`, `assets/js/plugin-preload.js`), so register was
   replaced with **`babel-hook.js`**: an in-process hook using `pirates` +
   `@babel/core` `transformSync` + `@cspotcode/source-map-support`, consuming
   the same `babel-register.config.js` (now `configFile`-based). `pirates` and
   `@cspotcode/source-map-support` became direct dependencies;
   `@babel/register` was dropped; `babel-hook.js` added to the release-build
   TARGET_LIST in `build/index.es`.

### Phase 1 verification

- Compiled-output diff vs the Phase 0 (Babel 7) baseline: only 22 of 239 files
  differ, all benign — `_extends` helper → native object spread, uninitialized
  annotated class fields now emitted as native `field;` declarations (matches
  tsc's ESNext define semantics), and type-only imports keeping a side-effect
  `require()`. styled-components outputs identical.
- `npm test` (25 suites / 189 tests / 26 snapshots), `npm run typecheck`, full
  `npm run lint:js`: all pass.
- Electron harness (Electron 43): babel-hook compiles in-repo `.ts` and
  outside-root `.es` fixtures in **both** main and renderer processes.
- `npx gulp --tasks` loads the gulpfile → `build/*.es` chain through babel-hook.
- Launching poi itself: full boot verified — main process (proxy, session
  preloads, devtools extensions), renderer (views compiled via babel-hook,
  theme system loaded), and the game view navigated into the live
  DMM/KanColle game with poi's usual iframe hooks active.
- Post-launch fix: `index.html` has an **inline `<script>`** that installs the
  require hook before `require('./views/env')` — it still referenced
  `@babel/register` because code greps scoped to `.js/.ts/.es` miss HTML.
  When auditing hook call sites, include `*.html` (`index.html` was the only
  one; `index-plugin.html` has none).
- Caveat: watch for `ELECTRON_RUN_AS_NODE=1` in VSCode-spawned shells when
  testing Electron manually — it silently turns Electron into plain Node.

**Phase 2 — follow-ups (separate PRs):**

- Evaluate `runtime: 'automatic'` for JSX (needs plugin-resolution verification).
- Audit whether the remaining stage-1 proposal plugins (do-expressions,
  function-bind, function-sent, throw-expressions) are still used by any published
  plugin; drop dead weight.

## Verify matrix (run for Phase 0 baseline and again after Phase 1)

- `npm test`, `npm run typecheck`, `npm run lint`
- `npm start` — app boots, game view loads (exercises `@babel/register` in
  Electron main + renderer)
- Install & load third-party plugins, including a legacy `.es` one
  (exercises the `overrides` block + plugin-preload register)
- `gulp build` + launch the packaged output (exercises `compile-to-js`)
- CI green on all three OSes

## References

- [Babel 8.0.0 release announcement](https://babeljs.io/blog/2026/06/16/8.0.0/)
- [Upgrade to Babel 8 guide](https://babeljs.io/docs/v8-migration)
- [Babel 7.29.0 — the last Babel 7 minor](https://babeljs.io/blog/2026/01/31/7.29.0)
- [babel/babel v8.0.0 discussion](https://github.com/babel/babel/discussions/18072)
