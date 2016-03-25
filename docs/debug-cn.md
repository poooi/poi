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
所有已创建handler都可通过`dbg.h.handlerName`(handlerName == Option Name)

`dbg.extra()` 会在 `dbg.h` 中(如果还不存在的话)创建一个同名的handler (`dbg.enableExtra()` 因为会call `dbg.extra()` 所以也能创建）。一旦handle被创建之后，`dbg.h.name` 便等效于 `dbg.extra('name')`。
例如：  
![image](https://cloud.githubusercontent.com/assets/13615512/12861206/7c6ce7c8-ccad-11e5-8e05-4c3139cc4c03.png)  
Handler的目的是为了可以充分利用dev tools的自动完成功能来简化我们需要手动完成的操作。例如：  
![image](https://cloud.githubusercontent.com/assets/13615512/12861507/a31588e2-ccaf-11e5-961d-2f4b5132bf26.png)

为避免混淆，简单概括如下：  
* 在code中一般用到的是 `dbg.extra('xxxx').isEnabled()`, `dbg.extra('xxxx').log(msg)`, `dbg.extra('xxxx').assert(cond, msg)`
* 在dev tools console一般用到的是 `dbg.h.xxxx.enable()`, `dbg.h.xxxx.disable()`
