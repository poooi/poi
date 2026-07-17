// Global declarations for the gulp build scripts.
// `latestCommit` is assigned by gulpfile.js (getVersion task) and read when
// rewriting package.json for the release build.

declare global {
  // eslint-disable-next-line no-var
  var latestCommit: string | undefined
}

export {}
