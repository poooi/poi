# Software Debugging Guide

## Access

#### Debug Module
Main (browser) process: `global.dbg`  
Renderer process: `window.dbg`  
Both can be accessed simply using `dbg`

#### Debug Option Handlers
Main Debug Option: `dbg.h.main` or `dbg.main()`.
`dbg` itself can be considered as a handler as well, which works the same to `dbg.h.main` (implementations are different though)

Extra Debug Options: `dbg.h.optionName` or `dbg.extra('optionName')`

\>> [Debug Option Handlers](#debug-option-handlers-1) <<

## API

### Methods of Debug Option Handlers

```
handler = dbg.h.optionName or dbg.extra('optionName')
```

#### `handler.enable()`
Enables the Debug Option

#### `handler.disable()`
Disables the Debug Option

#### `handler.isEnabled()`
Returns true if the Debug Option is enabled

#### `handler.log(msg)`
Logs only when the Debug Option is enabled

#### `handler.assert(cond, msg)`
Asserts only when the Debug Option is enabled

An example：  
![image](https://cloud.githubusercontent.com/assets/13615512/14062260/36946042-f3e4-11e5-9615-1e024035681a.png)

### Methods of dbg

#### `dbg.extra('optionName')`
Creates the Debug Option Handler named "optionName" if it doesn't exist yet, and returns the handler

#### `dbg.list()` _Dev Tools_
Lists all _created_ Debug Option Handlers in Dev Tools

#### `dbg.enableExtra('optionName')`
Same to `dbg.h.optionName.enable()`

#### `dbg.disableExtra('optionName')`
Same to `dbg.h.optionName.disable()`

#### `dbg.isExtraEnabled('optionName')`
Same to `dbg.h.optionName.isEnabled()`

## Debug Option Handlers

* A Debug Option Handler named "handlerName" (i.e., option name) will be created when `dbg.extra('handlerName')` is called for the first time.
* The naming rules of Debug Option Handlers are the same to variables.
* If the handler named "handlerName" already exists, `dbg.extra('handlerName')` simply returns it.
* All _created_ handlers can be accessed by `dbg.h.handlerName`.
* Debug Options can be enabled using [Command Line Arguments](command-line-args.md#debugging).
* Generally these are functions you'll use in your code:
  * `dbg.extra('xxxx').isEnabled()`
  * `dbg.extra('xxxx').log(msg)`
  * `dbg.extra('xxxx').assert(cond, msg)`
* Most of the time these are functions you'll type in your Dev Tools console:
  * `dbg.list()`
  * `dbg.h.xxxx.enable()`
  * `dbg.h.xxxx.disable()`
  * `dbg.extra('xxxx')` (only if `dbg.h.xxxx` hasn't been created yet)
* Accessing the handlers using `dbg.h.xxxx` in Dev Tools console can take advantage of Dev Tools' "Auto-Completion" feature, like:
  ![image](https://cloud.githubusercontent.com/assets/13615512/14062285/708745c0-f3e5-11e5-9df3-9a082d678180.png)
* Rarely, if you _deliberately_ want to access certain Debug Option **_without_** creating the handler, you can take advantage of the coffee script `?` operator, like `dbg.h.xxxx?.log('Some info.')`.  
  Take Debug Option `brk` as an example. It is used to break main renderer process code execution on the first line of app.cjsx. It's used only once on start of the app, and it will be unreasonable to create a handler for it. therefore, the code using it should be:  
  `debugger if dbg.h.brk?.isEnabled()`

## FAQ

#### **Q** When should I use the "main" Debug Option? When to use the extra options? Which extra option should I use?
**A** Theoretically you can use whatever option you like, or simply only use the "main" option.
However, this is a big project that involves a number of contributors.
To make the debugging information more accurate, more controllable, and other developers' lives easier,
it is better to use an extra debug option for your debugging code in some situations:
* When it produces a large number of logs
* When it significantly effects the app performance
* When its behaviour may annoy other developers

For whatever reason, it is better to discuss with other developers before making the choice.

Check out some existing debug options [here](command-line-args.md#known-extra-debug-options).

#### **Q** I have used `dbg.extra('xyz')` in my code, but the "xyz" option didn't (always) appear when I typed `dbg.list()` in Dev Tools.
**A** It very likely that at the time you typed `dbg.list()`, non of the code contains your `dbg.extra('xyz')` has been executed yet since the app started, so no handler is created for it.  
If you really want the handler be always available since app starts, put your `dbg.extra('xyz')` somewhere always executes, like at top of index.js, or in the initialisation sequence.

#### **Q** I've enabled option 'xyz' in the main window Dev Tools, but the option is not enabled in my new-window plugin.
**A** Different windows are different processes, they don't share the debug status. You need to enable the option in the Dev Tools of the new window.  
Alternatively, you can enable the debug option using [Command Line Arguments](command-line-args.md#debugging). It will then be enabled for _all windows_.
