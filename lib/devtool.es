import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'

import { log, error } from './utils'

const options = {
  loadExtensionOptions: { allowFileAccess: true },
}

installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], options)
  .then((name) => log(`${name} is added`))
  .catch((err) => error('An error occurred: ', err))
