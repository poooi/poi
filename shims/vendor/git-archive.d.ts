declare module 'git-archive' {
  interface GitArchiveOptions {
    commit: string
    outputPath: string
    repoPath: string
  }

  function gitArchive(
    options: GitArchiveOptions,
    callback: (err: Error | null, result?: unknown) => void,
  ): void

  export = gitArchive
}
