declare module 'module' {
  namespace Module {
    // Internal Node.js module cache (not in official @types/node)
    let _cache: Record<string, NodeModule>
    let _pathCache: Record<string, string | string[]>
  }
}
