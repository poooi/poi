# 软件调试指南

### CLI 支持

* `--debug[=true|false]` 开启/关闭 debug模式。`--debug` 同 `--debug=true`
* `-d` 同 `--debug`
* `--debug-extra=option1,option2,option3 --debug-extra=anotherOption` 开启extra debug option `option1`,`option2`,`option3`&`anotherOption`。Extra options 的命名规则与variable命名规则相同，option 之间用逗号隔开。
* `--debug-extra-d=options` 关闭相应的extra debug option。用法同 `--debug-extra`
* `--version | -v` 输出版本信息到console，然后退出。

以上所有arguments都可重复使用(`--version | -v` 除外，版本信息显示之后会立刻退出)，处理顺序为从左至右，重复的extra debug option会自动被处理掉。

### 访问

Main process 在 `global.dbg`，renderer process 在`window.dbg`。
都可以通过`dbg`直接访问。

### API

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
返回`dbg.ex`中相应的handler，如果还没有的话，创建一个新的并返回这个新handler。
* `dbg.extra(optionName).enable()`
* `dbg.extra(optionName).disable()`
* `dbg.extra(optionName).isEnabled()`
* `dbg.extra(optionName).log(msg)`
* `dbg.extra(optionName).assert(cond, msg)`  
与前面的`dbg.xxxxx()`类似，只是基于相应的option的状态。  
.
* `dbg.list()`  
一个神秘的魔法

##### 关于extra debug option handler
`dbg.extra()` 会在 `dbg.ex` 中(如果还不存在的话)创建一个同名的handler (`dbg.enableExtra()` 因为会call `dbg.extra()` 所以也能创建）。一旦handle被创建之后，`dbg.ex.name` 便等效于 `dbg.extra('name')`。
例如：
![image](https://cloud.githubusercontent.com/assets/13615512/12861206/7c6ce7c8-ccad-11e5-8e05-4c3139cc4c03.png)
Handler的目的是为了可以充分利用dev tools的自动完成功能来简化我们需要手动完成的操作。例如：
![image](https://cloud.githubusercontent.com/assets/13615512/12861507/a31588e2-ccaf-11e5-961d-2f4b5132bf26.png)

为避免混淆，简单概括如下：  
* 在code中一般用到的是 `dbg.extra('xxxx').isEnabled()`, `dbg.extra('xxxx').log(msg)`, `dbg.extra('xxxx').assert(cond, msg)`
* 在dev tools console一般用到的是 `dbg.ex.xxxx.enable()`, `dbg.ex.xxxx.disable()`
