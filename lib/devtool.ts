import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer'

import { log, error } from './utils'

type InstallExtensionOptions = {
  loadExtensionOptions?: {
    allowFileAccess: boolean
  }
}

const installExtensionWithOptions = installExtension as (
  extensionReference: Parameters<typeof installExtension>[0],
  options?: InstallExtensionOptions | boolean,
) => Promise<string>

installExtensionWithOptions([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS], {
  loadExtensionOptions: { allowFileAccess: true },
})
  .then((name) => log(`${name} is added`))
  .catch((err) => error('An error occurred: ', err))
