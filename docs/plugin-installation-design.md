# Isolate changes to the selected npm plugin

Installing, updating, repairing or removing plugin A can currently change shared dependencies and break plugin B. Keep the existing plugin manager and limit each operation to A and its private dependencies. [Issue #2740](https://github.com/poooi/poi/issues/2740)

The installer accepts npm registry package names, including scoped names and optional versions, ranges or tags. Validate the request before invoking npm. Reject local paths, tarballs, URLs, Git sources and aliases. Update, repair and retry use the same boundary and existing npm registry configuration.

Prepare A and its dependencies in a separate directory and validate the candidate while the old A is still running. Then unload the old instance, replace A's directory and load the replacement if enabled. Repair repeats installation for A. Uninstall removes A's directory and leaves shared dependencies in place.

## Acceptance

- Install A and B with different versions of a dependency. Update, repair and uninstall A. B's files and loaded dependency version remain intact, including when B uses a legacy shared dependency.
- Fail preparation while A is running. A remains usable. Fail replacement after unloading A. The UI clears progress, shows whether A is installed and running, and permits retry from the ordinary install entry point.
- Show the plugin name and error when installation fails. If installation succeeds but loading fails, show A as installed with a load error.
