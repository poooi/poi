---
name: game-webview
description: The KanColle game <webview> — contextIsolation + disablewebsecurity, the preload world split, the poi-cache:// asset-hack scheme, and the window.open popup crash. Use when editing views/kan-game-wrapper.tsx, assets/js/webview-preload.js, assets/js/resource-hack.js, assets/js/kcs-resource-path.js, lib/kcs-resource.ts, lib/webcontent-utils.ts, or when debugging game asset loading, screenshots, renderer crashes, or webview security settings.
---

# Game Webview

## Security posture

The game `<webview>` (`views/kan-game-wrapper.tsx`) runs with `contextIsolation: true` **and**
`disablewebsecurity`. The preload (`assets/js/webview-preload.js`) runs in the isolated world —
keeping Node and `@electron/remote` — and pushes page-facing hacks into the page's main world
via `contextBridge.executeInMainWorld`, communicating through the exposed `poiPreloadBridge`.

**Why `disablewebsecurity` stays**: enabling standard web security in the page's main world
breaks (a) the cross-origin game-iframe traversal used by the canvas screenshot
(`window.capture` in `capture-page.js`) and (b) historically `file://` asset loads. The canvas
capture is deliberately kept (better raw/resize-correct screenshots), so `disablewebsecurity`
must remain. `contextIsolation` still isolates the preload's Node from the untrusted page —
that is the security win.

The main poi window and plugin windows remain `contextIsolation: false` (plugins run Node
in-page) — out of scope for this skill.

## Asset hack — everything serves through `poi-cache://`

`lib/kcs-resource.ts` registers a privileged `poi-cache://` scheme plus a handler that
`net.fetch`es the local file, sets `ACAO: *`, and sets an explicit Content-Type by extension.
Two trigger paths:

### Scripts — two-tier policy

- `.hack.*` script overrides are served **proactively** by the main-process `webRequest`
  (override-only, so a mod always applies).
- Plain **cached** scripts are served **only on load failure**: a page-side capture-phase
  `error` listener in `resource-hack.js` re-injects a `/kcs*` script from cache when its
  network load fails.
- Proactive plain-cache serving is **forbidden**: stale version-pinned scripts
  (`main.js?version=...`) plus gadget RPC under `/gadget_html5/` break login with
  `Unexpected identifier 'error'`. This was tried both ways — do not re-attempt.
- The separate login `onError` path (runtime `kcsLogin` failure) still re-injects and re-runs
  the gadget handlers, which `webRequest` cannot do — so the page-side fallback stays
  regardless.

### Images and login scripts — page-side

`resource-hack.js`: an isolated-world resolver maps to `poi-cache://resource<pathname>`,
applied by the main-world `new Image()` hook and login-script reinjection.

Ship art is drawn onto the game's WebGL canvas, and a cross-origin image taints the texture
(`texImage2D` `SecurityError`). The fix is a CORS-clean load: the `new Image()` hook sets
`crossOrigin = 'anonymous'` on hacked images, paired with the handler's `ACAO: *`. Only hacked
images get `crossOrigin`, so same-origin network images are untouched. Images are deliberately
**not** in the `webRequest` path (page-side `crossOrigin` avoids both the WebGL taint and a 400).

### stylesheet / media / font / script — main-process `webRequest.onBeforeRequest`

`HACKABLE_RESOURCE_TYPES = { stylesheet, media, font, script }`. stylesheet/media/font resolve
`.hack.*` first, then the plain cached origin. `script` is in `OVERRIDE_ONLY_RESOURCE_TYPES`,
so `findHackFilePathAsync(..., overrideOnly = true)` serves only `.hack.*`. `xhr` and documents
are excluded because login evaluates XHR bodies.

### Implementation notes

- Content-Type comes from the `mime` package (v4, ESM-only) via a cached **native dynamic**
  `import('mime')` plus `import type { Mime }`. Babel keeps `import()` for poi files; a static
  import would transpile to a broken `require` of an ESM-only package.
- The webview uses `session.defaultSession` (no partition) — confirmed by `resource-notifier.ts`
  also hooking `defaultSession`.
- Shared path logic is plain JS in `assets/js/kcs-resource-path.js`, required from both the main
  process and the renderer preload, because main only babel-registers `.es` / `.ts` / `.tsx`.
- Broadcaster events (`network.on.response` etc.) are consumed in
  `views/env-parts/data-resolver.ts`, filtered to `/kcsapi` plus the `/kcs2/js/main.js`
  game-start marker — so the bridge's input validation allows the `/kcs` prefix.

## The window.open popup crash (diagnosed 2026-08-07)

Opening the DMM point-charge page (`point.dmm.com/choice/pay` -> `/choice/point`) from the game
killed the renderer: `reason: "crashed"`, exit code `-2147483645` (0x80000003
STATUS_BREAKPOINT), twice per attempt, **with no CHECK/FATAL line in either the Chromium log or
stderr**.

**Root cause**: `disablewebsecurity`. A `window.open` popup keeps an opener relationship with
the game page and therefore shares its renderer process; loading an ordinary secure page into
that web-security-disabled process crashes it, taking the game down too.

**Fix**: `wc.setWindowOpenHandler` on the guest webContents in `lib/webcontent-utils.ts` — deny
http(s) popups and re-open them in a detached `BrowserWindow` (`webSecurity: true`,
`sandbox: true`, no node), which drops the opener link. `about:blank` popups still take the
normal allow path, since the opener scripts them.

**Ruled out — do not re-test**: `--disable-site-isolation-trials` (app.ts), devtools extensions
(`poi.devtool.enable`), the proxy, Sentry, plugins, `@electron/remote`, and inherited
`webPreferences` (Electron's `makeWebPreferences` does _not_ inherit `preload` or
`disablewebsecurity` into child windows). A top-level window loading the same URL never
crashes — the opener relationship is required to reproduce. The original symptom was a
misleading `@electron/remote` / Sentry error about a disposed `WebFrameMain`, which is
downstream of the crash, not its cause.

## Deferred: WebContentsView migration

Replacing `<webview>` with `WebContentsView` has been scoped but deferred — it is blocked on an
Electron per-view click-through API. Do not start it without checking with the user.
