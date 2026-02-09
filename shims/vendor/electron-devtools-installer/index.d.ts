declare module 'electron-devtools-installer' {
  export interface ExtensionReference {
    id: string
    electron: string
  }

  export interface ExtensionOptions {
    forceDownload?: boolean
    loadExtensionOptions?: Record<string, unknown>
  }

  const install: (
    extensionReference: ExtensionReference | string | Array<ExtensionReference | string>,
    options?: ExtensionOptions | boolean,
  ) => Promise<string>

  export default install

  export const EMBER_INSPECTOR: ExtensionReference
  export const REACT_DEVELOPER_TOOLS: ExtensionReference
  export const BACKBONE_DEBUGGER: ExtensionReference
  export const JQUERY_DEBUGGER: ExtensionReference
  export const ANGULARJS_BATARANG: ExtensionReference
  export const VUEJS_DEVTOOLS: ExtensionReference
  export const VUEJS3_DEVTOOLS: ExtensionReference
  export const REDUX_DEVTOOLS: ExtensionReference
  export const CYCLEJS_DEVTOOL: ExtensionReference
  export const APOLLO_DEVELOPER_TOOLS: ExtensionReference
  export const MOBX_DEVTOOLS: ExtensionReference
}
