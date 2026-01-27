import type { ServerState } from '../server'

import { reducer } from '../server'

describe('server reducer', () => {
  const initialState: ServerState = {
    ip: null,
    id: null,
    name: null,
  }

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('should handle @@ServerReady action', () => {
    const serverInfo: ServerState = {
      ip: '203.104.209.71',
      id: 1,
      name: 'Yokosuka Naval District',
    }
    const result = reducer(initialState, {
      type: '@@ServerReady',
      serverInfo,
    })
    expect(result).toEqual(serverInfo)
  })

  it('should return current state for unknown actions', () => {
    const currentState: ServerState = {
      ip: '203.104.209.71',
      id: 1,
      name: 'Yokosuka Naval District',
    }
    const result = reducer(currentState, { type: 'UNKNOWN_ACTION' })
    expect(result).toBe(currentState)
  })
})
