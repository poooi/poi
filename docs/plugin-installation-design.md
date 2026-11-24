# Plugin Dependency Isolation

This document describes the design of plugin installation and dependency isolation in poi.
Background: [#2740](https://github.com/poooi/poi/issues/2740).

## 1. Goal & Boundaries

**Goal:** Resolve dependency conflicts between poi plugins by giving each plugin its own isolated dependency tree inside its own directory, while continuing to use npm for package distribution.

**Boundaries:**

- This design provides **install-time dependency isolation between plugins**. Changing poi host module resolution priority (`lib/module-path.ts`) or restricting Node's upward `require` lookup is out of scope.
- Only packages from the configured npm registry are allowed (no Git repositories, local directories, or tarballs).
- Failed replacements do not require automatic rollback; reflecting the actual post-failure state in the UI and allowing retry is sufficient.

---

## 2. Problems in the Current Implementation

- **Shared npm tree (`views/services/plugin-manager/index.ts`, `npm-utils.ts`):** All plugins are installed into a shared `PLUGIN_PATH` with a shared `package.json` (`ensurePackageJson`) and `package-lock.json`. Installing or removing one plugin reconciles the shared tree and can conflict with or disturb other plugins' dependencies. Current flags also include deprecated `--global-style` and non-existent `--no-prune` (in bundled `npm@11.18.0`).
- **Silent npm failures (`npm-utils.ts`):** `runScriptAsync` resolves unconditionally on `proc.on('exit')`, ignoring non-zero exit codes, signals, spawn errors, and stderr. Failed updates silently unload and re-read the old plugin as if the update succeeded.
- **Unrestricted sources & broken spec parsing (`index.ts`):** `installPlugin` accepts local paths/tarballs via `accessSync` and `findInstalledTarball`, and parses versions with `split('@')`, which breaks scoped package names (`@scope/poi-plugin-*`) that `NameInput` already allows.
- **Destructive `repairDep` (`npm-utils.ts`, `lifecycle.ts`):** Called on uninstall (`removePackage`) and startup load failures (`notifyFailed`), `repairDep` runs `require(p)` on every non-`poi-plugin` entry in `PLUGIN_PATH/node_modules` and deletes entries that throw—destroying valid ESM-only, subpath-only, and `@scope` dependencies used by other plugins. `notifyFailed` also fires unawaited parallel reinstalls.
- **Broken repair-all (`gracefulRepair` in `index.ts`):** Deletes `PLUGIN_PATH/node_modules` before unloading running plugins, includes `isExtra` plugins (`PLUGIN_EXTRA_PATH`) in uninstall/reinstall, and uses `Promise.all` (which starts all installs concurrently and rejects early on the first failure without tracking or reporting partial results).
- **Lifecycle order & UI failure/retry bugs (`index.ts`, `views/components/settings/plugin/index.tsx`):**
  - `installPlugin` overwrites files before calling `unloadPlugin`.
  - Failed installs leave `isUpdating` (`Redux`) and `installingPluginNames` (component state) stuck, preventing clean retry.
  - `pluginManager.once('installfailed', ...)` fires at most once per session.
  - Single-plugin install/update and batch operations (`doInstallAll`, `handleUpdateAll`, `gracefulRepair`) only `console.error` failures instead of surfacing them in the UI.
  - Batch loops call single-item handlers that reset `npmWorking` to `false` after the first plugin completes, and `handleUpdate`/`onRemove` look up plugins by array index instead of by plugin/package identity.

---

## 3. Target Layout & Registry-Only Validation

### 3.1 Per-Plugin Layout

Each npm-installed plugin is self-contained under `PLUGIN_PATH/node_modules`:

```text
<PLUGIN_PATH>/
└── node_modules/
    ├── poi-plugin-foo/
    │   ├── package.json
    │   └── node_modules/          # poi-plugin-foo's own runtime dependencies
    └── @scope/
        └── poi-plugin-bar/
            ├── package.json
            └── node_modules/      # @scope/poi-plugin-bar's own runtime dependencies
```

- Remove `ensurePackageJson()`; plugin management no longer maintains a shared `PLUGIN_PATH/package.json` or `package-lock.json`.
- Discover both unscoped (`poi-plugin-*`) and scoped (`@*/poi-plugin-*`) plugins in `readPlugins()` so discovery matches what `NameInput` and `installPlugin` accept.
- Existing installations with legacy shared dependencies in `PLUGIN_PATH/node_modules` are left untouched by single-plugin operations and continue to load; updated or newly installed plugins use the self-contained layout.

### 3.2 Registry-Only Package Validation

Enforce registry-only specs in the backend using `npm-package-arg` (already a dependency):

- Parse `packageSource` and optional `version` with `npm-package-arg` (replacing `split('@')`), supporting scoped names.
- Require `resolved.registry === true` and `resolved.type` in `['tag', 'version', 'range']`. This rejects Git URLs, `file:`/local paths, remote tarballs, and `npm:` aliases.
- For plugin installation, require the unscoped package name to match `/^poi-plugin-.+$/` (consistent with `readPlugin` and `NameInput`).
- Remove the local/tarball installation branch from `installPlugin` along with `findInstalledTarball` and `calculateShasum` from `npm-utils.ts` and its barrel re-exports in `utils.ts`.

---

## 4. Isolated Staging Installation & Lifecycle Order

### 4.1 Bundled npm in an Isolated Staging Directory

Use the already-bundled `npm` CLI (`node_modules/npm/bin/npm-cli.js`) via `child_process.fork` in a temporary staging directory on the same volume as `PLUGIN_PATH` (e.g., `PLUGIN_PATH/.staging/<tmp>`), so moving the installed plugin directory avoids cross-device (`EXDEV`) errors.

- **Fix `runScriptAsync`:** Run with `silent: true`, capture stderr/stdout diagnostics, and reject on `error` events or non-zero exit codes / signals.
- **Keep `wctf-db` unaffected:** `views/components/settings/about/update/wctf-db.tsx` calls generic `installPackage(packageName, version, npmConfig)`. Preserve `installPackage`'s calling contract for `wctf-db` (sharing the fixed exit-code/error handling in `runScriptAsync`), while plugin installation uses the isolated staging-and-move helper.
- **Staging manifest:** Write a minimal `{ "name": "poi-plugin-staging", "private": true }` `package.json` in the staging directory and pass `--prefix <stagingDir>` with `cwd: stagingDir` so npm never walks up to a legacy `PLUGIN_PATH/package.json`.
- **npm flags:**
  ```text
  install --prefix <stagingDir> --registry <registry> [--proxy <http_proxy>]
    --install-strategy=shallow --legacy-peer-deps --ignore-scripts
    --no-save --no-package-lock --no-audit --no-fund --no-progress -- <spec>
  ```
  With `--install-strategy=shallow` and `--legacy-peer-deps`, bundled npm installs the plugin's declared `dependencies` and installable `optionalDependencies` inside `<stagingDir>/node_modules/<packageName>/node_modules/` without hoisting them to `<stagingDir>/node_modules/`, while `peerDependencies` remain provided by the poi host as before.
- Always remove the temporary staging directory in a `finally` block.

### 4.2 Operation Serialization

Serialize mutating plugin-manager operations (`installPlugin`, `uninstallPlugin`, `gracefulRepair`) with a simple promise queue in `PluginManager` so concurrent calls (e.g., startup auto-update + user action) cannot race:

- Only public entry points enqueue onto the queue; internal helpers (e.g., the single-plugin install step invoked by `gracefulRepair`) run directly without re-entering the queue, avoiding self-deadlock.
- A failed operation must reject to its caller while allowing subsequent queued operations to proceed.

### 4.3 `stage -> unload -> replace -> load` Order & Failure State

For `installPlugin`:

1. **Validate & Stage:** Validate the registry plugin spec. If the plugin is currently installed, mark `isUpdating: true` in Redux. Stage-install into the temp staging directory.
   - _On failure:_ Clean up staging, reset `isUpdating: false` (if it was installed), and report the error. The previously running plugin remains untouched and retryable.
2. **Unload (if replacing an existing plugin):** Call `unloadPlugin(nowPlugin)` before touching its directory on disk, and update Redux so the plugin is no longer shown as running/enabled. Cache eviction during unload should respect the actual plugin directory boundary.
3. **Replace on disk:** Remove the existing target directory (if any) via `safePhysicallyRemove`, ensure the parent directory exists (for scoped plugins), and move `<stagingDir>/node_modules/<packageName>` into `PLUGIN_PATH/node_modules/<packageName>`. Clean up staging in `finally`.
   - _On failure:_ Do **not** assume the plugin is uninstalled without checking disk. Sync Redux to the actual on-disk state:
     - If the target directory no longer exists on disk, remove the plugin from Redux so it is shown as uninstalled and can be reinstalled.
     - If a directory still remains on disk (e.g., deletion failed due to file lock or partial move left files behind), keep it represented in Redux as non-running / broken (`enabled: false`, `isBroken: true`, `isUpdating: false`) rather than enabled or silently missing, while still allowing reinstall/remove.
4. **Load:** Call `readPlugin(targetPath)`. If `plugin.enabled && !window.isSafeMode`, call `enablePlugin(plugin, false)`. Dispatch `createPluginAddAction(plugin)`.
   - _On failure:_ If `readPlugin` throws, sync Redux to reflect the failure (not enabled) and report the error. Because `enablePlugin` currently catches load errors and returns `{ enabled: false, isBroken: true }`, `installPlugin` must also detect `plugin.isBroken` (and surface the load failure reason) so a broken load is reported as a failure rather than a successful install/enable.

---

## 5. Uninstall, `repairDep` Removal & Repair-All

### 5.1 Remove `repairDep` & `npm uninstall`

- Remove `repairDep` from `npm-utils.ts` and `utils.ts`.
- `notifyFailed` (`lifecycle.ts`) only displays the load-failure toast and no longer calls `repairDep` or triggers background reinstalls.
- `uninstallPlugin` unloads the plugin (marking it non-running) and deletes only its own directory (`safePhysicallyRemove` on `PLUGIN_PATH/node_modules/<packageName>` or `PLUGIN_EXTRA_PATH/node_modules/<packageName>`), without invoking `npm uninstall` (`removePackage` is removed). Apply the same disk-state sync principle as §4.3: remove the plugin from Redux once its directory is gone; if deletion fails and the directory remains on disk, report the error and keep it represented in Redux as non-running / broken (`enabled: false`, `isBroken: true`, `isUninstalling: false`) so removal or reinstall can be retried. If a scoped plugin's parent `@scope` directory becomes empty, remove it best-effort.

### 5.2 Repair-All (`gracefulRepair`)

Keep the existing semantics of "Repair all plugins":

1. Identify all plugins residing under `PLUGIN_PATH/node_modules` (leaving `isExtra` plugins under `PLUGIN_EXTRA_PATH` untouched).
2. Unload **all** of those affected plugins (including any `linkedPlugin` inside `PLUGIN_PATH/node_modules`) and mark them non-running **before** deleting files, so no stale running instances remain.
3. Delete `PLUGIN_PATH/node_modules` (and `PLUGIN_PATH/package.json` / `package-lock.json` if present) and recreate an empty `PLUGIN_PATH/node_modules`. Removing symlinks inside `PLUGIN_PATH/node_modules` unlinks them without touching their targets.
   - _On deletion failure:_ Report the error, do **not** proceed as if reinstallation completed, and sync Redux to the actual remaining plugins on disk (non-running, not enabled) so the user can retry.
4. Once `PLUGIN_PATH/node_modules` is cleared, remove the cleared plugins from Redux. If `repair === false` (`window.gracefulResetPlugin`), stop here.
5. Reinstall only the previously installed non-linked registry plugins **one by one** (sequentially via the internal install helper). If one installation fails, record and report the failure and continue with the next plugin. Return a structured result (`{ succeeded, failed }`) to the caller.

---

## 6. UI Failure Reporting & Retryability

In `views/components/settings/plugin/index.tsx` and `plugin-item.tsx`:

- **Clear busy states reliably:** Always clear `installingPluginNames` in `finally`. Keep `npmWorking` owned by the top-level action handler rather than inner per-plugin helpers called in batch loops, so batch operations stay locked until the full batch finishes.
- **Avoid index-based lookups:** Pass the `Plugin` object (or `packageName`) directly to update/remove handlers instead of indexing `getInstalledPlugins()[index]`.
- **Surface single and partial failures via existing UI channels:**
  - Replace `pluginManager.once('installfailed', ...)` with `.on(...)` (cleaned up on unmount).
  - Report failures for manual install, bundled-plugin install, single update, install-all, update-all, startup auto-update, and repair-all using the existing `window.toast` and `PluginConfig` status `Callout` channels, naming failed plugins and concise error reasons (including partial-failure summaries for batch operations).
  - Update `InstallFailedMsg` in `i18n/setting/*.json` to remove the obsolete reference to selected local files.
- **Ensure retryability:** After any failure, controls return to an actionable state (bundled plugins remain installable, manual install stays usable, intact plugins keep their update action, and broken plugins keep reload/remove/reinstall paths).

---

## 7. Verification Plan

1. **Clean isolated install:** In a clean `PLUGIN_PATH`, install two plugins requiring incompatible versions of the same dependency. Verify each plugin has its own `node_modules/<dep>` with its expected version and `PLUGIN_PATH/node_modules/` contains no shared top-level dependency directories.
2. **Cross-plugin safety (clean and legacy installs):** Update and uninstall one plugin; verify another plugin's dependencies and runtime behavior are undamaged. Repeat on an existing `PLUGIN_PATH` containing legacy shared dependencies to confirm single-plugin operations do not delete shared dependencies used by other plugins.
3. **Registry-only enforcement & scoped plugins:** Verify registry specs (unscoped and `@scope/poi-plugin-*`, with/without version/range/tag) are accepted and discoverable across restart, while Git URLs, local paths, tarball URLs, and `npm:` aliases are rejected. Verify `wctf-db` updates continue to work.
4. **Failure reporting, lifecycle order, and retry:**
   - Non-zero npm exit during staging fails cleanly, reports the error in UI, preserves an already-installed plugin, clears busy indicators, and allows retry.
   - Unload runs before disk replacement; a simulated replacement failure syncs Redux to actual disk state (never leaving an uninstalled or broken plugin appearing enabled) and allows reinstallation.
   - A plugin that installs on disk but fails to load (`isBroken`) is reported as a failure and shown as broken, not enabled.
5. **Repair-all with partial failure:** With multiple plugins installed (including one whose reinstall fails and one `isExtra` plugin), run `gracefulRepair()`. Verify all `PLUGIN_PATH` plugins are unloaded before directory deletion, `isExtra` is untouched, remaining plugins are reinstalled one by one despite the middle failure, and the failure is reported in the UI.
