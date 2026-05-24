import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-extension-installer'

import { log, error } from './utils'

installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], {
  loadExtensionOptions: { allowFileAccess: true },
})
  .then((name) => log(`${name} is added`))
  .catch((err) => error('An error occurred: ', err))
