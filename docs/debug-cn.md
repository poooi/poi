# 软件调试指南

## 访问

#### Debug Module
Main (browser) process: `global.dbg`  
Renderer process: `window.dbg`  
都可以通过`dbg`直接访问。

#### Debug Option Handlers
Main Debug Option: `dbg.h.main` 或 `dbg.main()`. `dbg`本身也可看作是一个handler，等效于`dbg.h.main`（尽管实现方式不完全相同）

Extra Debug Options: `dbg.h.name` 或 `dbg.extra('name')`  
_注: `dbg.h.xxxx`是由`dbg.extra('xxxx')`创建的，在代码中如果想用`dbg.h.xxxx`却又不确定其对应的handler是否已创建时可用`?`形式访问，如：`dbg.h.xxxx?.log('Some info.')`_

参考：[Debug Option Handlers](#关于 Debug Option Handlers)

## API

* `dbg.enable()`  
开启debug
* `dbg.disable()`  
禁用debug
* `dbg.isEnabled()`  
返回debug是否开启
* `dbg.log(msg)`  
仅在debug开启时有效的log
* `dbg.assert(cond, msg)`  
仅在debug开启时有效的assert

举个栗子：  
![image](https://cloud.githubusercontent.com/assets/13615512/12860073/02004a2c-cca6-11e5-8609-720cf7c40b34.png)

* `dbg.enableExtra(optionName)`
* `dbg.disableExtra(optionName)`
* `dbg.isExtraEnabled(optionName)`  
看名字应该能猜到是干嘛的
* `dbg.extra(optionName)`  
返回`dbg.h`中相应的handler，如果还没有的话，创建一个新的并返回这个新handler。
* `dbg.extra(optionName).enable()`
* `dbg.extra(optionName).disable()`
* `dbg.extra(optionName).isEnabled()`
* `dbg.extra(optionName).log(msg)`
* `dbg.extra(optionName).assert(cond, msg)`  
与前面的`dbg.xxxxx()`类似，只是基于相应的option的状态。  
.
* `dbg.list()`  
一个神秘的魔法

## 关于 Debug Option Handlers

* 第一次运行 `dbg.extra('handlerName')`时会创建(并返回)一个名为“handlerName”（即 option name）的handler。
* Handler Name 的命名规则同变量命名规则。
* 如果名为“handlerName”的handler已存在，`dbg.extra('handlerName')`会直接返回该handler。
* 所有已创建handler都可通过 `dbg.h.handlerName` 访问。
  ![image](https://cloud.githubusercontent.com/assets/13615512/12861206/7c6ce7c8-ccad-11e5-8e05-4c3139cc4c03.png)
* 在代码中一般会用到的是
  * `dbg.extra('xxxx').isEnabled()`
  * `dbg.extra('xxxx').log(msg)`
  * `dbg.extra('xxxx').assert(cond, msg)`
* 在dev tools console一般会用到的是
  * `dbg.h.xxxx.enable()` (`dbg.extra('xxxx').enable()`)
  * `dbg.h.xxxx.disable()` (`dbg.extra('xxxx').disable()`)  
* 在dev tools console中通过`dbg.h.xxxx`来访问handler的好处是可以充分利用dev tools的自动完成功能来简化我们需要手动完成的操作。例如:
  ![image](https://cloud.githubusercontent.com/assets/13615512/12861507/a31588e2-ccaf-11e5-961d-2f4b5132bf26.png)
* 少数情况下在代码中，如果刻意需要访问特定Debug Option却**_不创建_**其相应的handler，可利用coffee script的`?`，如：`dbg.h.xxxx?.log('Some info.')`
