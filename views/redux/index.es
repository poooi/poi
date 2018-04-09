import { combineReducers } from './combine-reducers'
import { mapValues, isEqual } from 'lodash'

import { reducer as constReducer } from './const'
import { reducer as info } from './info'
import { reducer as sortie } from './sortie'
import { reducer as timers } from './timers'
import { reducer as config } from './config'
import { reducer as layout } from './layout'
import { reducer as battle } from './battle'
import { reducer as plugins } from './plugins'
import { reducer as fcd } from './fcd'
import { reducer as ui } from './ui'
import { reducer as ipc } from './ipc'
import { reducer as wctf } from './wctf'
import misc from './misc'

const emptyObject = {}

// === Utils ===

// === Root reducer ===

function secureExtensionConfig(extensionConfig) {
  return mapValues(extensionConfig, (func, key) => {
    if (func) {
      // Use combineReducers to check sanity of `func`
      const wrappedReducer = combineReducers({_: func})
      return (state={}, action, store) => {
        try {
          return wrappedReducer(state, action, store)
        } catch(e) {
          console.error(`Error in extension ${key}`, e.stack)
          return state
        }
      }
    } else {
      return () => emptyObject
    }
  })
}

export function reducerFactory(extensionConfig) {
  return combineReducers({
    const: constReducer,
    info,
    sortie,
    timers,
    config,
    battle,
    misc,
    fcd,
    plugins: window.isMain ? plugins: (() => emptyObject),
    layout: window.isMain ? layout: (() => emptyObject),
    ui: window.isMain ? ui: (() => emptyObject),
    ext: extensionConfig ? combineReducers(secureExtensionConfig(extensionConfig)) : (() => emptyObject),
    ipc,
    wctf,
  })
}

// === Actions ===

export function onGameResponse({method, path, body, postBody, time}) {
  return {
    type: `@@Response${path}`,
    method,
    path,
    body,
    postBody,
    time,
  }
}

export function onGameRequest({method, path, body, time}) {
  return {
    type: `@@Request${path}`,
    method,
    path,
    body,
    time,
  }
}

export function onConfigChange({path, value}) {
  return {
    type: `@@Config`,
    path,
    value,
  }
}

// publish data changes to plugin windows
if (!window.isMain) {
  window.addEventListener('storage', e => {
    if (e.key === '_storeCache') {
      const { fcd, wctf = {} } = JSON.parse(e.newValue)
      for (const key of Object.keys(fcd)) {
        if (!isEqual(fcd[key], window.getStore(`fcd.${key}`))) {
          // eslint-disable-next-line no-console
          console.log(`Update ${key} from localStorage`)
          window.dispatch({
            type: "@@replaceFCD",
            value: {
              path: key,
              data: fcd[key],
            },
          })
        }
      }
      if (wctf.lastModified && wctf.lastModified !== window.getStore('wctf.lastModified')) {
        // eslint-disable-next-line no-console
        console.log(`Update wctf-db to ${wctf.version} from localstorage`)
        window.dispatch({
          type: '@@wctf-db-update',
          payload: wctf,
        })
      }
    }
  })
}
