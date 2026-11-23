import { spawn } from 'node:child_process'

import { InstallerError } from './installer-error'

const DEFAULT_NPM_OUTPUT_LIMIT = 64 * 1024

interface NpmCommandOptions {
  npmCliPath: string
  args: string[]
  cwd: string
  timeoutMs?: number
  env?: NodeJS.ProcessEnv
  /** Set npm_config_proxy/npm_config_https_proxy instead of argv. */
  proxy?: string
}

export function redactNpmOutput(text: string): string {
  return text
    .replace(/(_authToken\s*[=:]\s*)\S+/gi, '$1[redacted]')
    .replace(/(Bearer\s+)\S+/gi, '$1[redacted]')
    .replace(/(https?:\/\/)[^\s/@:]+:[^\s/@]+@/gi, '$1[redacted]@')
    .slice(0, DEFAULT_NPM_OUTPUT_LIMIT)
}

function npmCommandEnvironment(env?: NodeJS.ProcessEnv, proxy?: string): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = { ...process.env, ...env }
  if (proxy) {
    result.npm_config_proxy = proxy
    result.npm_config_https_proxy = proxy
  }
  if (process.versions.electron) result.ELECTRON_RUN_AS_NODE = '1'
  return result
}

/**
 * Runs the bundled npm CLI. Resolves with stdout on success and rejects with
 * an `InstallerError` carrying `stage: 'npm'` on spawn, timeout or exit
 * failures. Callers keep their own argv, timeout and output policies.
 */
export function runNpmCommand(options: NpmCommandOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const startError = (error: unknown) =>
      new InstallerError('ENPM', 'Failed to start npm', {
        stage: 'npm',
        detail: redactNpmOutput(error instanceof Error ? error.message : String(error)),
      })
    let child
    try {
      child = spawn(process.execPath, [options.npmCliPath, ...options.args], {
        cwd: options.cwd,
        env: npmCommandEnvironment(options.env, options.proxy),
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      reject(startError(error))
      return
    }

    let stdout = ''
    let stderr = ''
    let timedOut = false
    const append = (current: string, chunk: Buffer | string) =>
      current + String(chunk).slice(0, DEFAULT_NPM_OUTPUT_LIMIT - current.length)
    child.stdout?.on('data', (chunk: Buffer | string) => {
      stdout = append(stdout, chunk)
    })
    child.stderr?.on('data', (chunk: Buffer | string) => {
      stderr = append(stderr, chunk)
    })
    const timer =
      options.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true
            child.kill()
          }, options.timeoutMs)
    child.once('error', (error) => {
      clearTimeout(timer)
      reject(startError(error))
    })
    child.once('close', (code, signal) => {
      clearTimeout(timer)
      if (!timedOut && code === 0) {
        resolve(stdout)
        return
      }
      const command = 'npm ' + (options.args[0] ?? 'command')
      const reason = signal ? 'signal ' + signal : 'code ' + String(code)
      reject(
        new InstallerError(
          timedOut ? 'ETIMEDOUT' : 'ENPM',
          timedOut ? command + ' timed out' : command + ' exited with ' + reason,
          { stage: 'npm', detail: redactNpmOutput(stderr || stdout) },
        ),
      )
    })
  })
}
