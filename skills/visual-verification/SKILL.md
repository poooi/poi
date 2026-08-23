---
name: visual-verification
description: Capture window-scoped before/after screenshots of the running poi UI over the Chrome DevTools Protocol to verify a visual change. Use when asked to screenshot poi, to show what a UI change looks like, or to confirm a CSS/layout/theme change actually renders — anything needing a picture of the app rather than a test result.
---

# Visual Verification of poi (CDP)

## Never use desktop capture

Full-desktop capture (e.g. PowerShell `CopyFromScreen`) grabs unrelated windows — a privacy
problem, and useless when poi is not the foreground window. Always capture the poi renderer
directly over CDP.

## Procedure

1. Launch poi with the debugging port, clearing the inherited env var (see the `build-and-run`
   skill for why):

   ```bash
   env -u ELECTRON_RUN_AS_NODE npx electron . --remote-debugging-port=9222
   ```

2. Poll `http://127.0.0.1:9222/json/list` until it responds.
3. Pick the target whose `url` contains `index.html` — that is the main renderer.
4. Connect with Node >= 22's built-in `WebSocket` (no dependency needed) and send
   `Page.captureScreenshot`. Write the throwaway script into the scratchpad directory with the
   Write tool and run it with `node <abs-path>` — **do not use a bash heredoc**, this session's
   shell wrapper mangles the quoting.
5. Capture the baseline first (e.g. on `master`), then the branch, and compare the two PNGs by
   reading them.

## What is and is not comparable

poi restores cached redux state from `localStorage` on boot, so fleet and mini-ship panels
render populated **without logging into the game**. However, the row _data_ can differ between
boots as the cache updates — so compare **styling and layout, not content**.

## Single-instance lock

If the user's own poi is running, the launched instance exits immediately with "Another
instance is running". Their process may be named `poi.exe` rather than `electron.exe`. Kill
only test instances:

```bash
taskkill //F //IM electron.exe
```

That never touches the packaged `poi.exe`.
