# Frequently Changed Data (FCD)

FCD 为频繁更新的游戏数据。这些数据不能从游戏 API 中简单获得，需要开发者手动更新维护。


## FCD 判断标准

满足以下条件的数据可以考虑放到 FCD：
1. 是游戏数据，但只能由开发者手动更新
2. 有两个或以上插件（含本体）使用的数据

以下数据不适合放到 FCD：
1. 该数据即该插件的核心功能，如装备改修插件。


## 数据文件
一个文件必须包含两个部分：meta 和 data。

### meta
必须包含：
* `name`：数据的标识。
* `version`：数据的版本，格式为`yyyy/MM/dd/vv`。

可选包含：
* `filename`：数据文件名，默认为`${name}.json`。

### data
data 数据将会直接插入`store.fcd.${name}`路径。

### 范例
```
{
  "meta": {
    "name": "example",
    "version": "1984/02/30/01"
  },
  "data": [
    1, 1, 2, 3, 5, 8
  ]
}
```
```
store.fcd.example = [1, 1, 2, 3, 5, 8]
```