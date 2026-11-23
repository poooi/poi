import childProcess from 'child_process'
import { EventEmitter } from 'events'

jest.mock('views/env', () => {
  const path = require('path')
  return {
    config: { get: jest.fn(() => '') },
    ROOT: path.resolve(__dirname, '../../../..'),
  }
})

jest.mock('child_process', () => ({ spawn: jest.fn() }))

import { installPackage } from '../npm-utils'

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
