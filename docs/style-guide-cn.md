# 代码风格规范

本文档简要介绍向 poi 提交代码的风格规范。良好一致的代码风格能够为其他贡献者，以及将来的你自己阅读代码提供方便，请尽量遵守本文档所列出的一些事项。

## Eslint 检查
poi 项目使用 [eslint](http://eslint.org/) 作为代码检查工具，并附带了 `.eslintrc.js` 配置文件。你可以通过[命令行](http://eslint.org/docs/user-guide/command-line-interface)来执行 eslint 检查，也可以使用支持 eslint 或带有 eslint 扩展的编辑器来进行开发，例如：
+ Sublime Text 3 + SublimeLinter + SublimeLinter-eslint
+ Atom + Linter
+ Visual Studio Code + ESlint

eslint 检查需要满足不存在错误（error），以及尽量少的警告（warning)，当然，由于我们的规则不一定十分完善，如果有无法消除的错误提示，可以在代码注释或者 Pull Request 中附言说明。

## 其它要求
### 命名
由于游戏 api 的变量名为下划线连接单词的蛇式命名（如 `api_mst_slotitems`)，在代码中允许出现这样的变量命名，然而对于你自己定义的变量命名，请使用[小驼峰式命名法](https://zh.wikipedia.org/wiki/%E9%A7%9D%E5%B3%B0%E5%BC%8F%E5%A4%A7%E5%B0%8F%E5%AF%AB)来加以命名（如 `apiMstSlotitems`）。例如：

``` javascript
const {api_maparea_id, api_mapinfo_no} = postBody
const mapId = `${api_maparea_id}${api_mapinfo_no}`
```
函数的命名与变量命名类似。

常量的命名建议使用大写单词的蛇式命名，如 `MAX_RETRY`，`APPDATA_PATH`。

对于类（以及 React 元素）的命名，使用大驼峰式命名法，如 `FileWriter`，`ShipView`。

文件名使用小写字母单词以连接线相连的命名法，例如 `file-writer.es`，`ship-view.es`

### 载入与导出
在有 babel es6 环境的情况下，尽量使用 babel 的 `import` / `export` 语法，即:
``` javascript
import { remote } from 'electron'
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom'

export const extendReducer = ...
```
请留意大括号与变量名之间会保留一个空格。

在一些特殊情况下，也允许使用 `require`，如：
``` javascript
import Promise from 'bluebird'
const fs = Promise.promisifyAll(require('fs-extra'))
```

### 文件末尾留空行

### 注释
可以在任何你认为有需要的地方留下注释。

### JSX 的缩进
JSX 的不同层次元素的缩进也请按照 2 个空格的方式来进行。
