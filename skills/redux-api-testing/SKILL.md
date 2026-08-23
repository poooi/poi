---
name: redux-api-testing
description: Working with kcsapi game-API payloads in redux — typing action creators, sourcing real response-saver fixtures, writing slice/middleware tests, and avoiding `as` / `any`. Use when editing views/redux/**, adding an API response action, writing or fixing tests under __tests__, needing a real API payload sample, or inspecting api_start2 master data.
---

# Redux / kcsapi API Work

AGENTS.md carries the canonical typing and fixture rules; this skill adds the operational
parts — where real payloads come from and how to work with them.

## Where real payloads live

poi's response-saver writes every game API response to disk. On Windows the directory is:

```
%APPDATA%\poi\response-saver\kcsapi
```

(that is `<user home>\AppData\Roaming\poi\response-saver\kcsapi`). The exact root is
machine-specific — if it is not there, ask the user rather than guessing.

- Layout: one directory per API path (e.g. `api_req_nyukyo/start/`), files named by timestamp.
  Newest first: `ls -t | head`.
- File shape is exactly the fixture shape: `{ method, path, body, postBody, time }`.
- **Prefer a real capture over a synthetic payload** whenever the payload shape affects
  behaviour. Copy the JSON into `views/redux/info/__tests__/__fixtures__/` **unchanged** — no
  reformatting or minifying — so it stays byte-comparable with the original.
- Captures only go back about 10 days.

### `api_start2/getData/` — master data

The authoritative source for ship `api_ctype` / `api_stype`, equipment ids, and everything
else in `api_mst_ship` / `api_mst_slotitem`. Player ships are `api_id < 1500`. Use it to
validate ctype lists (combat predicates, quest nationality lists) rather than trusting a wiki
summary.

### Privacy

**Never quote the absolute capture path** in commit messages, PR bodies, issue comments or
release notes — AGENTS.md's privacy rule. Write "from a response-saver capture" instead, and
use repo-relative paths for fixtures.

## Fixture naming

Name fixtures **behaviour first**, not just by endpoint — many endpoints have several
interesting shapes. Consult the field semantics (what `api_locked`, `api_state` etc. actually
mean) so the name reflects the payload's meaning.

- `api_req_nyukyo_start_highspeed_bucket_repairs_immediately.json`
- `api_get_member_ndock_instant_completion_shows_empty.json`
- `api_req_hensei_lock_unlock_ship.json` — the path says `lock`, but `api_locked: 0` means the
  captured _behaviour_ is unlock; the filename reflects the behaviour.
- `api_port_port_typical.json`

If you rename a fixture, rename its import variable and every path reference in the tests, then
run `npm test -- --testPathPattern="views/redux/info/__tests__"`.

## Test conventions

- Reducers migrated to RTK `createSlice` with
  `extraReducers(builder.addCase(actionCreator, ...))` match on the **action creator**, so
  tests must dispatch the real creator from `views/redux/actions.ts`, not a raw
  `{ type: '...' }` object.
- Let TypeScript infer fixture types by assigning to a typed variable rather than casting:

  ```ts
  const payload: GameResponsePayload<APIGetMemberNdockResponse[], APIGetMemberNdockRequest> =
    ndockFixture
  dispatch(createAPIGetMemberNdockResponseAction(payload))
  ```

- For intentionally-invalid payloads that exercise a guard branch, use `@ts-expect-error` on
  the specific invalid field with a reason — never `as unknown as` on the whole object.
- Electron/remote dependencies: `jest.mock('@electron/remote', () => ({ require }))`.

## Cross-slice behaviour

Behaviour spanning multiple endpoints or slices goes in a small middleware that listens to API
response actions and dispatches an **internal domain action** (e.g. `@@info.ships@RepairCompleted`),
defined in `views/redux/actions.ts` alongside the API actions. See
`views/redux/middlewares/ships-cross-slice.ts`.

One notable edge case is instant docking completion: when repair finishes in under 60 seconds,
the following `api_get_member/ndock` shows the dock empty (`api_ship_id === 0`,
`api_state === 0`) as if it never happened. `views/redux/info/ships.ts` bridges this with a
short-lived module-level `instantDockingCompletionState` set by `api_req_nyukyo/start` and
consumed on the next `ndock`. Test it with a real fixture pair and assert the repair applies
exactly once.

## Type suppressions — reviewed, do not re-attempt

A full audit (2026-07-05) removed ~30 suppressions via better typing. The remaining ones were
judged inherent. `tsc` errors on an _unused_ `@ts-expect-error`, so a green typecheck proves
every remaining one still suppresses a live error.

Do not try to fix these:

- `webview.tsx` JSX attributes (`nodeintegration={'on'}` etc.) — `@types/react` wrongly
  declares them boolean.
- Settings config components (checkbox / switch / radio / text / integer / folder-picker):
  `config.set(configName as ConfigPath, v as never)` — these accept arbitrary plugin config
  paths (plain strings) by design, and `ConfigPath` cannot cover plugin keys. (`ShortcutConfig`
  was fixable only because its paths are a closed union.)
- Generic plumbing: `lib/config.ts` emit/get internals, `views/utils/tools.ts` generics
  (`pickExisting`, `compareUpdate`, `copyIfSame`),
  `views/redux/{reducer-factory,combine-reducers,create-store}.ts`, `data-resolver.ts`,
  `lib/ipc.ts`, `views/redux/info/quests.ts` (lodash `forEach` over hybrid record types),
  `views/redux/layout/index.ts` `getIntegerSize`.
- Boundary assertions kept deliberately per the "assert once at the boundary" rule:
  `lib/constant.ts` (CSON), `views/env-parts/const.ts` (`remote.require`), `update.tsx`
  (fetch json), `views/redux/info/index.ts` (admiral-change reset).
- Upstream/internal: `lib/touchbar.ts`, `lib/module-path.ts`, polyfills
  (react-bootstrap / react-window), the `tab-area` private-method hack,
  `plugin-wrapper.tsx` styled `forwardRef`, `left-panel.tsx` React 19 `RefObject` compat,
  `i18next.ts` `store.emit`.

Related gotcha found in that audit: `electron-react-titlebar` invokes a menu `click` handler as
`(item, MouseEvent)` — the second argument is **not** a window, unlike Electron's
`remote.Menu`, which passes `(item, BaseWindow | undefined, event)`. Handlers that need a
window must check `instanceof remote.BrowserWindow` and fall back to
`remote.getCurrentWindow()`.
