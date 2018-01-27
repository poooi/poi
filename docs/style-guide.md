# Code style guide

This document is the style guide for poi. Good and coherent style is helpful to other contributors and yourself in the future. Please follow them.

## Make ESlint happy
poi uses [ESlint](http://eslint.org/) as code linter, and is bundled with `.eslintrc.js` conf file. ESlint is accessible through [command line](http://eslint.org/docs/user-guide/command-line-interface), or you may try editors with ESlint extensions, e.g.
+ Sublime Text 3 + SublimeLinter + SublimeLinter-eslint
+ Atom + Linter
+ Visual Studio Code + ESlint

You should avoid ESlint errors, and leave as few warnings as you can. Our rules are not perfect, so if you encounter any ESLint errors that cannot be resolved, please provide details of the error in comments or Pull Request.

## Other styles
### Naming
Game api's style use snake_case (e.g. `api_mst_slotitems`). You are allowed to use them for your variable definition too. However, [camelCase](https://en.wikipedia.org/wiki/Camel_case) is recommended, for example, `apiMstSlotitems`.

``` javascript
const {api_maparea_id, api_mapinfo_no} = postBody
const mapId = `${api_maparea_id}${api_mapinfo_no}`
```
Function use the same naming rules as variables.

For constants, use SNAKE_CASE: `MAX_RETRY`，`APPDATA_PATH`.

For class or react element, use PascalCase: `FileWriter`，`ShipView`.

For files use kebab-case: `file-writer.es`，`ship-view.es`

### import export
if babel es6 is available, please use babel's `import` / `export` syntax:
``` javascript
import { remote } from 'electron'
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom'

export const extendReducer = ...
```
Please note the space between variables and curly braces.

In some cases, however, `require` is inevitable:
``` javascript
import Promise from 'bluebird'
const fs = Promise.promisifyAll(require('fs-extra'))
```

### Leave a blank line (EOL) at the end of file

### Code Comments
Please feel free to write comments in your code where necessary.

### JSX
Indentation for JSX are also 2 spaces.
