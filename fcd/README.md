Frequently Changed Data
----

## 文件
一个文件必须包含两个部分：meta 和 data


## meta
必须包含：
* `name`：数据的标识。
* `version`：数据的版本，格式为`yyyy/MM/dd/vv`。

可选包含：
* `filename`：数据文件名，默认为`${name}.json`。
* `store`：数据在 store 中的路径，默认为`store.fcd.${name}`。


## data
data 数据将直接插入`meta.store`指定的路径。


## 范例
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