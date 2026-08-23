---
name: build-and-run
description: Building and launching poi locally — Babel 8 constraints that must not be regressed, the ELECTRON_RUN_AS_NODE trap, gulp build limitations, and the glob v13 Windows path flag. Use when editing babel.config.js, babel-hook.js, babel-register.config.js, gulpfile.js, build/**, app.ts, index.html, or package.json build config; when running `gulp build` or launching Electron; or when a build/plugin/i18n load silently produces nothing.
---

# Building and Running poi

## Launching Electron — the one trap that always bites

`ELECTRON_RUN_AS_NODE=1` is inherited from VSCode-spawned and Claude Code shells and silently
turns Electron into plain Node — `require('electron')` then fails and `app.getVersion` crashes.
**Always clear it:**

```bash
env -u ELECTRON_RUN_AS_NODE npx electron .
```

poi also holds a single-instance lock: if the user's own poi is running, a launched instance
exits with "Another instance is running" (their process may be named `poi.exe`, not
`electron.exe`). Kill test instances with `taskkill //F //IM electron.exe` — that never touches
the packaged `poi.exe`.

## Babel 8 constraints — easy to regress, do not undo

poi migrated to Babel 8 on 2026-07-16 (`docs/babel8-migration.md` has the full log).

- **`@babel/register` can never come back.** register@8 compiles in a `node:worker_threads`
  worker unconditionally, and Electron renderer processes cannot create Node workers
  (`nodeIntegrationInWorker` does not help). poi registers the hook in renderers
  (`views/env.ts`, `assets/js/plugin-preload.js`), so it uses the local in-process
  `babel-hook.js` (pirates + `transformSync` + `@cspotcode/source-map-support`), fed by
  `babel-register.config.js` (`configFile`-based; options must stay simple / structured-cloneable-ish).
- **`babel-plugin-styled-components` is shimmed** in `babel.config.js`
  (`styledComponentsBabel8Shim`): it no-ops `assertVersion(7)` and strips
  `inherits: syntax-jsx`. npm `overrides` in package.json align its `@babel/core` peer and
  `@babel/plugin-syntax-jsx` dep. Remove all three only when upstream ships Babel 8 support.
- **preset-react must stay scoped away from plain `.ts`** (config `overrides` with
  `exclude: /\.ts$/`): Babel 8's preset-typescript no longer strips the JSX parser plugin for
  `.ts`, so JSX-everywhere breaks generic arrows like `<T>(x) => x`.
- **`onlyRemoveTypeImports: false` must stay** on preset-typescript: otherwise Babel 8 keeps a
  side-effect `require()` for type-only imports, crashing plugins that import types from
  tsc-only specifiers.
- **`modules: 'commonjs'` must stay explicit** in preset-env: Babel 8 keeps ESM when the caller
  declares nothing, and `build/compile-to-js.es` is such a caller. It must also keep threading
  `assumptions` and `overrides` through — it destructures the config.
- **`declare global { var x }` plus a module-level `const x` in the same file breaks Babel 8's
  parser** (tsc accepts it). Such blocks live in `lib/globals.d.ts` and
  `views/env-parts/globals.d.ts` — do not move them back.
- The `assumptions` block is loose-mode-equivalent **only with `enumerableModuleMeta: true`**,
  which the official Babel migration list omits.
- **`index.html` installs the require hook in an inline `<script>`** (before
  `require('./views/env')`). When auditing hook call sites, grep `*.html` too — a
  `.js`/`.ts`/`.es`-scoped grep misses it.

## glob v13 on Windows

poi migrated `glob` ^7 -> ^13 on 2026-07-28. glob v9+ treats `\` as an **escape character on
all platforms**, so patterns built from `ROOT` or `path.join()` (backslashes on Windows) match
**nothing** — silently, with no error.

**Every glob call site must pass `{ windowsPathsNoEscape: true }`.** Returned paths stay
backslash-absolute, identical to v7 output, so downstream path handling is unaffected.

Other v13 API changes already applied: no default export (`import { glob }` / `{ globSync }`),
no callback form (`glob()` returns a Promise, so `promisify(glob)` and
`new Promise(res => glob(p, cb))` were removed). The old callback form swallowed errors and
yielded `[]`; the promise form rejects, so `.catch(() => [])` preserves that in
`views/services/plugin-manager/`.

**Failure mode to watch for**: a missing flag shows up as "no plugins found" or "i18n didn't
load", never as an exception.

## `gulp build`

- `gulp build` archives from **git HEAD** — commit before building, or it builds stale sources.
- Stage-2 `npm ci --only=production` may fail locally if the machine lacks a VC++ toolset
  (`electron-drag-click` needs node-gyp). npm then rolls back and leaves
  `app_compiled/node_modules` empty. **The gulp task still exits 0**, because `runScript` in
  `build/utils.ts` ignores child exit codes — so a green run does not prove success. Release
  artifacts are built in GitHub CI where the toolchain exists, so this is environmental.
- To verify artifacts locally anyway: (1) check the stage-1 compile output — no `.es` / `.ts` /
  `.tsx` outside `__tests__` / `__mocks__`, `package.json` rewritten with `latestCommit`; and
  (2) smoke-boot it with `env -u ELECTRON_RUN_AS_NODE npx electron app_compiled`. Node
  resolution walks up to the repo's own `node_modules`, so the empty artifact `node_modules`
  does not block the boot.
