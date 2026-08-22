import {
  createInitIPCAction,
  createRegisterIPCAction,
  createUnregisterIPCAction,
  createUnregisterAllIPCAction,
} from '../actions/ipc'
import { reducer } from '../ipc'

describe('ipc reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('should seed scopes from initIPC', () => {
    expect(reducer({}, createInitIPCAction({ PluginA: { foo: true } }))).toEqual({
      PluginA: { foo: true },
    })
  })

  it('should merge newly registered keys into an existing scope', () => {
    const state = reducer(
      { PluginA: { foo: true } },
      createRegisterIPCAction({
        scope: 'PluginA',
        opts: { bar: () => {} },
      }),
    )
    expect(state).toEqual({ PluginA: { foo: true, bar: true } })
  })

  it('should not create a scope when unregistering an unknown one', () => {
    const initialState = { PluginA: { foo: true } }
    const state = reducer(
      initialState,
      createUnregisterIPCAction({
        scope: 'PluginB',
        keys: ['bar'],
      }),
    )
    expect(state).toBe(initialState)
  })

  it('should remove only the unregistered keys', () => {
    const state = reducer(
      { PluginA: { foo: true, bar: true } },
      createUnregisterIPCAction({
        scope: 'PluginA',
        keys: ['bar'],
      }),
    )
    expect(state).toEqual({ PluginA: { foo: true } })
  })

  it('should drop the whole scope on unregisterAll', () => {
    const state = reducer(
      { PluginA: { foo: true }, PluginB: { bar: true } },
      createUnregisterAllIPCAction({ scope: 'PluginA' }),
    )
    expect(state).toEqual({ PluginB: { bar: true } })
  })
})
