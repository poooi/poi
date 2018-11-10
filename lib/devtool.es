import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer'

import { log, error } from './utils'

installExtension(REACT_DEVELOPER_TOOLS)
  .then(name => log('React Devtool is added'))
  .catch(err => error('An error occurred: ', err))
