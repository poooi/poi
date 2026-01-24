# AI Agent Instructions for poi Repository

This document provides instructions and context for AI agents working on the poi repository.

## Repository Overview

poi is an Electron-based game assistant for Kantai Collection (KanColle). It uses:

- **React** for UI components
- **Redux** with **@reduxjs/toolkit** for state management
- **TypeScript** for type safety
- **Jest** for testing
- **ESLint** with Prettier for code formatting
- **npm** as the package manager

## Project Structure

### Key Directories

- `/views/redux/` - Redux store, reducers, and actions
  - `/views/redux/info/` - Info reducers for game state (ships, fleets, equips, etc.)
  - `/views/redux/actions.ts` - Action creators for API responses
- `/views/components/` - React components
- `/views/utils/` - Utility functions
- `/lib/` - Core library code (Electron main process)

### Test Location

Tests are located in `__tests__` directories adjacent to the code being tested:

- `/views/redux/info/__tests__/` - Tests for info reducers
- Test files use `.spec.ts` or `.spec.es` extension

## TypeScript Migration Guidelines

### File Extensions

The codebase uses multiple file extensions:

- `.ts` - TypeScript files (preferred for new code)
- `.tsx` - TypeScript React components
- `.es` - ES6 JavaScript files (legacy, being migrated)
- `.js` - JavaScript files

### Migrating `.es` files to TypeScript

1. Rename the file from `.es` to `.ts`
2. Add type annotations for:
   - Function parameters and return types
   - State interfaces
   - Action interfaces
3. Export type definitions for use by other modules
4. Update imports in dependent files if needed

### Example State Interface Pattern

```typescript
export interface Ship {
  api_id: number
  api_ship_id?: number
  api_nowhp?: number
  api_maxhp?: number
  // ... other properties
}

export interface ShipsState {
  [key: string]: Ship
}
```

### Example Reducer Pattern

```typescript
export function reducer(
  state: ShipsState = {},
  { type, body, postBody }: Action,
  store?: Store,
): ShipsState {
  switch (type) {
    case '@@Response/kcsapi/api_port/port':
      // handle action
      return newState
    default:
      return state
  }
}
```

## API Action Creators

### Location

API action creators are defined in `/views/redux/actions.ts`.

### kcsapi Package

The `kcsapi` package provides TypeScript types for the game API:

- Request types: `API*Request` (e.g., `APIGetMemberDeckRequest`)
- Response types: `API*Response` (e.g., `APIGetMemberDeckResponse`)

### Pattern for Creating Action Creators

```typescript
import { createAction } from '@reduxjs/toolkit'
import { APIExampleRequest, APIExampleResponse } from 'kcsapi'

interface GameResponsePayload<Body, PostBody> {
  method: string
  path: string
  body: Body
  postBody: PostBody
  time: number
}

export const createAPIExampleResponseAction = createAction<
  GameResponsePayload<APIExampleResponse, APIExampleRequest>
>('@@Response/kcsapi/api_path/endpoint')
```

### Payload Shape Notes

- Some endpoints return arrays even if `kcsapi` exports an item type (e.g. `api_get_member/ndock` is `APIGetMemberNdockResponse[]` in practice). Prefer matching the real response shape when typing `GameResponsePayload`.
- Avoid dangerous double assertions like `as unknown as T` in reducers/middlewares.
  - Prefer typing at the action creator boundary (`views/redux/actions.ts`) and carrying real types through.
  - If the real payload is known to be partial/variant, introduce a small `*Compat` type (e.g. `Partial<APIShip> & { api_id: number }`) and use it consistently.
  - If you must assert, do it once at the boundary and keep internal logic strongly typed.

### Finding Available Types

To see available types from kcsapi:

```bash
cat node_modules/kcsapi/index.ts
```

### Field Name Reference

- For game API field naming and rough payload shape reference, `ElectronicObserver/Other/Information/apilist.txt` is often useful (may be outdated; treat as a hint, not a source of truth).
- URL: `https://raw.githubusercontent.com/andanteyk/ElectronicObserver/develop/ElectronicObserver/Other/Information/apilist.txt`

### Custom Types for Missing APIs

Some API endpoints are not typed in kcsapi. Define custom types with a `FIXME` comment:

```typescript
// FIXME: Not in kcsapi package - @@Response/kcsapi/api_req_hensei/preset_order_change
export interface APIReqHenseiPresetOrderChangeRequest {
  api_verno: string
  api_preset_from: string
  api_preset_to: string
}

export interface APIReqHenseiPresetOrderChangeResponse {
  api_result: number
  api_result_msg: string
}
```

### Currently Missing from kcsapi

These API endpoints are used but not typed in the kcsapi package:

1. `@@Response/kcsapi/api_req_hensei/preset_order_change`
2. `@@Response/kcsapi/api_req_member/updatedeckname`
3. `@@Response/kcsapi/api_req_air_corps/change_name`
4. `@@Response/kcsapi/api_req_air_corps/change_deployment_base`

## Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test -- --testPathPattern="info"

# Run with coverage
npm test -- --coverage
```

### Test File Pattern

```typescript
import { reducer, StateType } from '../reducer-file'

describe('reducer name', () => {
  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('should handle specific action', () => {
    const body = {
      /* mock response */
    }
    const result = reducer(initialState, {
      type: '@@Response/kcsapi/api_path/endpoint',
      body,
    })
    expect(result).toEqual(expectedState)
  })
})
```

### RTK Slice Tests

- If reducers are migrated to RTK `createSlice` with `extraReducers(builder.addCase(actionCreator, ...))`, tests should dispatch the real action creator from `views/redux/actions.ts` (not raw `{ type: '...' }` objects), since `addCase` matches on the action creator.

### Avoiding `as unknown as` in Tests

- Prefer letting TypeScript infer fixture types by assigning to a typed variable:

```ts
const payload: GameResponsePayload<APIGetMemberNdockResponse[], APIGetMemberNdockRequest> =
  ndockFixture
dispatch(createAPIGetMemberNdockResponseAction(payload))
```

- If a test intentionally constructs an invalid payload to cover a guard branch, prefer `@ts-expect-error` with the specific reason instead of `as unknown as`:

```ts
const payload: GameResponsePayload<APIReqNyukyoStartResponse, APIReqNyukyoStartRequest> = {
  method: 'POST',
  path: '/kcsapi/api_req_nyukyo/start',
  body: { api_result: 1, api_result_msg: 'ok' },
  // @ts-expect-error api_ship_id is missing; test invalid payload guard
  postBody: { api_verno: '1', api_highspeed: '0', api_ndock_id: '1' },
  time: 0,
}
```

### Avoiding Unnecessary `as` (Reducers/Tests)

- Before adding a type assertion (`as T`), try removing it; often a small runtime guard (e.g. `typeof x === 'number'`) is enough for TypeScript to narrow.
- For guard-branch tests, prefer `@ts-expect-error <reason>` on the specific invalid field over asserting the whole object.
- Treat `as` as a last resort: only use it when TypeScript cannot express a known runtime truth, and keep the asserted surface area as small as possible (assert one field at the boundary, not the whole payload).

### How to Avoid `as` in Practice

- Push typing to the boundary: type API response action creators in `views/redux/actions.ts` so reducers/middlewares can be strongly typed without assertions.
- Prefer `unknown` + narrowing instead of asserting: use `typeof`, `Array.isArray`, `in`, null checks, and `Number.isFinite` to validate data before use.
- Use small runtime-safe helpers over `as`: e.g. `const x = String(value ?? '')`, `const n = Number(v); if (!Number.isFinite(n)) return`.
- Prefer `satisfies` for fixtures/objects: `const payload = fixture satisfies GameResponsePayload<...>` verifies shape at compile time without changing the value's type.
- For intentionally-invalid fixtures in tests, use `@ts-expect-error` on the specific invalid field instead of casting the whole object.
- If a structure is "almost" typed but missing fields (response-saver partials), introduce a named `*Compat` type (e.g. `Partial<T> & { api_id: number }`) rather than `as unknown as T`.

### Avoiding `any`

- Avoid `any` as much as possible; prefer precise types, `unknown` + narrowing, or small `*Compat` types when payloads are partial/variant.

### Privacy / Redaction

- Do not include user-specific identifiers or local absolute paths in anything that will be sent outside this machine (commit messages, PR titles/bodies, issue comments, release notes, etc.).
- Examples to avoid: usernames, `%APPDATA%` expansions like `C:\Users\<name>\...`, machine names, home directory paths.
- Prefer repo-relative paths (e.g. `views/redux/info/__tests__/...`) and generic wording (e.g. “from response-saver capture”) instead.

### Arrays vs `kcsapi` Element Types

- Some endpoints return arrays in practice, but the `kcsapi` package only exports the element type.
- Prefer typing the action creator payload as `T[]` (array) and add a short NOTE like:
  `kcsapi exports the element type; this endpoint's body is an array in practice.`

### Response-Saver Fixtures

- Prefer tests built from real response-saver payload JSONs (shape: `{ method, path, body, postBody, time }`). In this repo, fixtures live under `views/redux/info/__tests__/__fixtures__/`.
- Response-saver location is machine-specific; on Windows it is typically under `%APPDATA%\poi\response-saver\kcsapi`.
- For tests that require response-saver fixtures, prefer copying the JSON file into the repo fixture path unchanged (no reformatting/minifying). This helps keep the fixture byte-for-byte comparable with the original response-saver file.
- If you don't know where the response-saver fixtures live on this machine, ask the user (it's machine-specific). Once you have the location, prefer searching there for a real capture before writing a synthetic payload.
- Fixture naming: prefer “behavior first” names (include the noteworthy scenario/branch/result, not just the endpoint), since many endpoints have multiple interesting shapes.
  - When choosing the “behavior” wording, consult the API doc / field semantics (e.g. meaning of flags like `api_locked`, `api_state`, etc.) so the filename reflects what the payload actually means.
  - Examples: `api_req_nyukyo_start_highspeed_bucket_repairs_immediately.json`, `api_get_member_ndock_instant_completion_shows_empty.json`, `api_port_port_typical.json`.
  - The endpoint path may still include `lock` (e.g. `api_req_hensei/lock`), but the _behavior_ can be unlock (`api_locked: 0`) or lock (`api_locked: 1`). Reflect the behavior in the filename (e.g. `api_req_hensei_lock_unlock_ship.json`).
  - If you rename a fixture, also rename/update its import variable and path references in tests, then run `npm test -- --testPathPattern="views/redux/info/__tests__"`.

## Cross-Slice Patterns

- Some behaviors span multiple API endpoints and/or slices. Prefer implementing these as a small middleware that listens to API response actions and dispatches an internal domain action.
- Example: `views/redux/middlewares/ships-cross-slice.ts` listens to `@@Response/kcsapi/api_req_nyukyo/speedchange` (use bucket) and dispatches an internal ships action to mark the relevant ship as repaired.

## Internal Domain Actions

- Prefer internal RTK actions (e.g. `@@info.ships@RepairCompleted`) for cross-slice updates instead of dispatching raw `{ type: '...' }` objects.
- Define internal actions in `views/redux/actions.ts` alongside API response actions so they are easy to import and strongly typed.

## Instant Docking Completion

- There is an in-game edge case where docking completes in < 60 seconds and the subsequent `api_get_member/ndock` response shows the dock as empty (`api_ship_id === 0`, `api_state === 0`) as if docking never happened.
- `views/redux/info/ships.ts` handles this using a short-lived module-level state (`instantDockingCompletionState`) that is set by `api_req_nyukyo/start` and then consumed/reset during the next `api_get_member/ndock`.
- When adding tests for this behavior, use a real fixture pair (`api_req_nyukyo_start_*` + `api_get_member_ndock_*`) to validate the repair is applied exactly once.

### Mocking External Dependencies

For tests that require electron/remote:

```typescript
jest.mock('@electron/remote', () => ({ require }))
```

## Linting and Formatting

### Commands

```bash
# Lint all files
npm run lint:js

# Lint specific directory
npm run lint:js -- views/redux/info

# Auto-fix issues
npm run lint:js -- --fix views/redux/info
```

### Pre-commit Hooks

The repository uses lint-staged with husky. ESLint runs automatically on staged files during commit.

## Common Utility Functions

Located in `/views/utils/tools.ts`:

- `indexify(array, key)` - Converts array to object indexed by key
- `compareUpdate(prevState, newState, depth)` - Immutable update helper
- `pickExisting(state, body)` - Remove keys not in body
- `copyIfSame(obj, original)` - Clone only if same reference
- `buildArray(pairs)` - Build sparse array from index-value pairs

## Redux Store Structure

The main store structure under `info`:

- `basic` - Admiral basic info
- `ships` - Ship roster
- `fleets` - Fleet compositions
- `equips` - Equipment
- `repairs` - Repair docks
- `constructions` - Construction docks
- `resources` - Materials
- `maps` - Map progress
- `quests` - Quest tracking
- `airbase` - Land-based air corps
- `presets` - Fleet presets
- `server` - Server info
- `useitems` - Consumable items

## Tips for AI Agents

1. **Always run tests** after making changes to ensure nothing is broken
2. **Check kcsapi types** before creating custom types
3. **Follow existing patterns** in the codebase for consistency
4. **Export types** from reducers for use by components
5. **Use null guards** for potentially undefined values from API responses
6. **Keep FIXME comments** for custom types that should be added to kcsapi

## Conversation Context Marker

- Append the exact phrase `This is Chiba assisting` to every assistant response.
- If that phrase is missing, treat it as a context-loss signal and re-load `AGENTS.md` into the working context.
