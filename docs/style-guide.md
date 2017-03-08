# Code style guide

The document introduces the style guide for codes submited to poi. Codes of good and coherent style is friendly to other contributors and yourself in the future. Please follow them.

## Make eslint happy
poi uses [eslint](http://eslint.org/) as code linter, and is bundled with `.eslintrc.js` conf file. Eslint is accessible through [command line](http://eslint.org/docs/user-guide/command-line-interface), or you may try editors with eslint extensions, e.g.
+ Sublime Text 3 + SublimeLinter + SublimeLinter-eslint
+ Atom + Linter
+ Visual Studio Code + ESlint

You should avoid eslint errors, and leave as few warnings as you can; our rules, however, cannot be 100% perfect, so if you encounter errors that cannot be fixed, please provide the information in code comments or Pull Request.

## Other styles
### Naming
Game api's variable naming are snake_case (e.g. `api_mst_slotitems`), you're allow to use them, for your variable definition, however, [camelCase](https://en.wikipedia.org/wiki/Camel_case) naming is recommended, for example, `apiMstSlotitems`.

``` javascript
const {api_maparea_id, api_mapinfo_no} = postBody
const mapId = `${api_maparea_id}${api_mapinfo_no}`
```
Function naming rules are the same as variables.

for constants, use SNAKE_CASE: `MAX_RETRY`，`APPDATA_PATH`.

For class or react element, use CamelCase: `FileWriter`，`ShipView`.

Files are naming in snake-case, e.g. `file-writer.es`，`ship-view.es`

### import export
if babel es6 is available, please use babel's `import` / `export` syntax:
``` javascript
import { remote } from 'electron'
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom'

export const extendReducer = ...
```
Please notice the space between variables and angle brackets.

In some cases, however, `require` is inevitable:
``` javascript
import Promise from 'bluebird'
const fs = Promise.promisifyAll(require('fs-extra'))
```

### Leave a blank line (EOL) at the end of file

### Comments
Feel free to leave comments where necessary.

### JSX
Indentation for JSX are also 2 spaces.