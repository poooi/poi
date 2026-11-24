import childProcess from 'child_process'
import { EventEmitter } from 'events'
import fs from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

jest.mock('views/env', () => {
  const path = require('path')
  return {
    config: { get: jest.fn(() => '') },
    ROOT: path.resolve(__dirname, '../../../..'),
  }
})

jest.mock('child_process', () => ({ spawn: jest.fn() }))

import { installPackage, removeExtraPackage } from '../npm-utils'

describe('generic npm install (WCTF compatibility)', () => {
  it('passes the proxy through the environment, never argv', async () => {
    const stderr = new EventEmitter()
    const proc = Object.assign(new EventEmitter(), { stderr })
    // @ts-expect-error the test only needs the close/stderr surface of the child
    jest.mocked(childProcess.spawn).mockImplementation(() => {
      setTimeout(() => proc.emit('close', 0, null), 0)
      return proc
    })

    const proxy = 'http://dummy%40user:dummy%3Apass@proxy.example:8080'
    await installPackage('whocallsthefleet-database', '1.0.0', {
      prefix: '/appdata/wctf-db',
      registry: 'https://registry.example/',
      enableBetaPluginCheck: false,
      http_proxy: proxy,
    })

    expect(childProcess.spawn).toHaveBeenCalledWith(
      process.execPath,
      expect.arrayContaining(['install', 'whocallsthefleet-database@1.0.0']),
      expect.objectContaining({
        env: expect.objectContaining({
          npm_config_proxy: proxy,
          npm_config_https_proxy: proxy,
        }),
      }),
    )
    const call = jest.mocked(childProcess.spawn).mock.calls[0]
    const args = call?.[1] ?? []
    expect(args).not.toContain('--proxy')
    expect(args.join(' ')).not.toContain('dummy')
  })
})

it('preserves an extra checkout with a .git file and reports an absent package separately', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'poi-extra-'))
  try {
    await fs.writeFile(path.join(root, '.git'), 'gitdir: ../worktree')
    await fs.writeFile(path.join(root, 'local.txt'), 'uncommitted')
    expect((await removeExtraPackage(root)).removed).toBe(false)
    expect(await fs.readFile(path.join(root, 'local.txt'), 'utf8')).toBe('uncommitted')
    expect(await removeExtraPackage(path.join(root, 'missing'))).toMatchObject({ missing: true })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
