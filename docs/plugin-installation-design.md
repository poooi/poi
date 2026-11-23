# Isolated plugin installation

Installing or updating a plugin must leave other plugins and their dependencies alone. The bundled npm CLI installs one plugin at a time in a fresh staging project outside the active plugin root. Its shallow layout keeps dependencies with the plugin when poi moves it to `plugins/node_modules/<package-name>`. npm continues to handle package resolution, registry configuration, authentication, caching and integrity checks. See [implementation issue #2740](https://github.com/poooi/poi/issues/2740).

## Installation and retry

1. Parse registry names, versions, ranges and tags with `npm-package-arg`. Preserve the full name for scoped packages. For a local tarball, determine its name and version from the installed manifest so a renamed archive works.
2. Create a private staging project on the same volume as the plugin directory. Run the bundled npm CLI with an explicit prefix, shallow installation, legacy peer dependency handling and lifecycle scripts disabled. Use the trusted project and user npm configuration, including scoped registries, mirrors, proxies and TLS settings. Keep credentials out of arguments and diagnostics.
3. Check the candidate's package identity, entry and dependency layout before unloading the active plugin. Keep source metadata with the installed package so repair can use its registry or original tarball.
4. Replace only the selected managed package directory. Protect development links, Git worktrees and extra plugins. The main process serializes writes. The renderer manages plugin windows, loading and installation progress.
5. If preparation fails, the installed copy is still available. If replacement fails after the installed copy has been removed, report the failure, clear the progress indicator and reflect the actual state on disk. The user can install the package again from the usual entry point or select the original tarball. A plugin whose entry throws after installation remains installed and reports its load error.

## Existing installations

Discover ordinary and scoped plugins from disk and preserve extra-plugin precedence, safe mode and enablement preferences. Update or repair one plugin at a time. Preserve the legacy shared dependencies used by other plugins. A batch repair reports each result and continues after an individual failure. Use the recorded source for repairs and ask for a source when a legacy installation cannot be identified reliably.

The WCTF database updater keeps its independent prefix and generic package installer. Continue to support offline release tarballs. Runtime module resolution, including host-provided React, is unchanged.

## Acceptance

Install A and B with different versions of a shared dependency. Force replacement of A to fail after its old directory has been removed. Check that the failure clears the busy state, then reinstall A through the same entry point and load it. Compare B's files and loaded version before and after the operation.
