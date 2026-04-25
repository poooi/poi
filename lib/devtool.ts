import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'

import { log, error } from './utils'

installExtension(
  [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS],
  // @ts-expect-error electron-devtools-installer 3.2.0 does not export ExtensionOptions; TS5 drops it from the union
  { loadExtensionOptions: { allowFileAccess: true } },
)
  .then((name) => log(`${name} is added`))
  .catch((err) => error('An error occurred: ', err))
