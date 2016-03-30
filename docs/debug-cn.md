# 软件调试指南

## 访问

#### Debug Module
Main (browser) process: `global.dbg`  
Renderer process: `window.dbg`  
都可以通过`dbg`直接访问。

#### Debug Option Handlers
Main Debug Option: `dbg.h.main` 或 `dbg.main()`。`dbg`本身也可看作是一个handler，等效于`dbg.h.main`（尽管实现方式不完全相同）。

Extra Debug Options: `dbg.h.optionName` 或 `dbg.extra('optionName')`

\>> [Debug Option Handlers](#关于-debug-option-handlers) <<

## API

### Methods of Debug Option Handlers

```
handler = dbg.h.optionName or dbg.extra('optionName')
```

#### `handler.enable()`
开启对应 Debug Option

#### `handler.disable()`
禁用对应 Debug Option

#### `handler.isEnabled()`
返回对应 Debug Option 是否开启

#### `handler.log(msg)`
仅在对应 Debug Option 开启时有效的log

#### `handler.assert(cond, msg)`
仅在对应 Debug Option 开启时有效的assert

一个例子：  
![image](https://cloud.githubusercontent.com/assets/13615512/14062260/36946042-f3e4-11e5-9615-1e024035681a.png)

### Methods of dbg

#### `dbg.extra('optionName')`
若名为"optionName"的handler不存在，创建并返回该handler  
若该handler已存在，便直接返回此handler

#### `dbg.list()` _Dev Tools_
列出所有_已创建_ Debug Option Handlers。

#### `dbg.enableExtra('optionName')`
同 `dbg.h.optionName.enable()`

#### `dbg.disableExtra('optionName')`
同 `dbg.h.optionName.disable()`

#### `dbg.isExtraEnabled('optionName')`
同 `dbg.h.optionName.isEnabled()`

## 关于 Debug Option Handlers

* 第一次运行 `dbg.extra('handlerName')`时会创建(并返回)一个名为“handlerName”（即 option name）的handler。
* Handler Name 的命名规则同变量命名规则。
* 如果名为“handlerName”的handler已存在，`dbg.extra('handlerName')`会直接返回该handler。
* 所有已创建handler都可通过 `dbg.h.handlerName` 访问。
* Debug Option可利用 [CLI参数](command-line-args.md#debugging) 开启。
* 在代码中一般会用到的是
  * `dbg.extra('xxxx').isEnabled()`
  * `dbg.extra('xxxx').log(msg)`
  * `dbg.extra('xxxx').assert(cond, msg)`
* 在dev tools console一般会用到的是
  * `dbg.list()`
  * `dbg.h.xxxx.enable()`
  * `dbg.h.xxxx.disable()`
  * `dbg.extra('xxxx')` (如果`dbg.h.xxxx`还没被创建的话)
* 在dev tools console中通过`dbg.h.xxxx`来访问handler的好处是可以充分利用dev tools的自动完成功能来简化我们需要手动完成的操作。例如:  
  ![image](https://cloud.githubusercontent.com/assets/13615512/14062285/708745c0-f3e5-11e5-9df3-9a082d678180.png)
* 代码中在少数情况下，如果_刻意_需要访问特定Debug Option却**_不创建_**其相应的handler，可利用coffee script的`?`，如：`dbg.h.xxxx?.log('Some info.')`  
  举个例子：Debug Option `brk`，作用是在主renderer process 运行app.cjsx中任何代码之前暂停代码的运行。因为此option只在程序刚启动时起一次作用，即使为其创建一个handler也毫无意义，所以应该用下面的代码来避免创建handler：  
  `debugger if dbg.h.brk?.isEnabled()`

## FAQ

#### **Q** 什么情况下我需要用“Extra Debug Option”？
**A** 理论上你可以用任意的option，甚至偷懒只用“main”。不过poi是一个有很多人参与的项目，为了使调试信息更加准确，更有针对性，也为了其他的开发人员能够更加愉~~悦~~快地贡献代码，在一些情况下最好是使用“Extra Debug Option”而不是“main”：
* 当你的调试代码会生成大量的log
* 当你的调试代码会明显影响程序的性能
* 当调试代码产生的行为可能会引起其他人的不适

不管怎样，再做决定之前与其他开发人员讨论一下永远不失为一个好办法。

点 [这里](command-line-args.md#known-extra-debug-options) 参考已有的 Debug Options。

#### **Q** 我在代码中用了`dbg.extra('xyz')`，但是`dbg.list()`里面却没有"xyz"这一项（或者有时有有时没有）
**A** 很可能从程序启动到你运行`dbg.list()`的时候，程序都还没运行到任何包含`dbg.extra('xyz')`的代码，因此还没为"xyz"创建相应的handler。  
如果你确实需要确保你的handler从一开始就会被创建，把`dbg.extra('xyz')`放到如index.js顶端，或者init里面这种一定会一开始就被运行到的地方。

#### **Q** 我在主窗口的Dev Tools中开启了 debug option “xyz”，但在我的新窗口插件中该option仍是禁用状态。
**A** 不同的窗口是不同的进程，它们不共享状态。如果你想开启新窗口的debug option，需要在新窗口的Dev Tools中执行。  
或者，你可以用 [命令行参数](command-line-args.md#debugging)的方式来开启，这样做对_所有窗口_都有效。
