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

- `name`：数据的标识。
- `version`：数据的版本，格式为`yyyy/MM/dd/vv`。

可选包含：

- `filename`：数据文件名，默认为`${name}.json`。

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

## 更新 map.json

`gen-map.js` 直接从游戏的 kcs2 地图资源
（`/kcs2/resources/map/<海域>/<地图>_info.json`）重新生成 `map.json`，
并输出一个 HTML 复核页面，把生成结果叠加在游戏自己的地图美术上，
方便肉眼确认后再提交。算法移植自
[kcs2-mapdata](https://github.com/KagamiChan/kcs2-mapdata)，
其中手动标注点名的 Electron 工具替换为「从现有 `map.json` 按坐标沿用点名」。

点名（A、B…；出击点为 1、2…）来自游戏本身：

- 活动图中后期开放的点，名字直接写在 secret 文件的 `labels` 数组里；
- 一开始就可见的点，名字被烤进 `*_point` 图层的像素里，由 `map-ocr.js`
  用模板匹配读出来（游戏画字和它自己的 label 精灵图逐像素相同，
  所以模板库只需从游戏资源和现有 `map.json` 里采样，不需要任何 OCR 依赖）。

脚本按以下顺序确定点名，并在复核页面上用颜色区分来源：
`--names` 覆盖 → 现有 `map.json` 坐标精确匹配 → 游戏 `labels` 数据 →
从地图美术读出的名字 → 现有 `map.json` 就近匹配（点被挪动过）→
**猜测**（按首次出现顺序取下一个字母）。
游戏给出名字但被别的来源盖掉时，会作为「name clash」报告出来，不会静默改写；
`--prefer-game-names` 可以让游戏的名字优先。猜测的点名没有任何依据，
必须对着复核页面里游戏画出的字母逐个核对。

模板匹配的准确率可以用 `node fcd/verify-map-ocr.js` 复核：它对每张图把该图
自己的样本从模板库里剔除，再把名字读回来和 `map.json` 对比。

```bash
# 1. 试运行（不写入任何文件），--start2 用 response-saver 里的 api_start2 抓包
node fcd/gen-map.js --start2 <api_start2.json>

# 2. 打开 fcd/.cache-map/review.html，检查 new / changed / guessed 的地图
# 3. 在 fcd/.cache-map/names-todo.json 里改掉猜错的点名（已按猜测值预填）
# 4. 写入并生成 assets
node fcd/gen-map.js --start2 <api_start2.json> --names fcd/.cache-map/names-todo.json --write
node fcd/build.js
```

10 以上的世界是活动图，同一时间只有 `api_mst_mapinfo` 里列出的那一期是进行中的，
其余活动海域都已结束、不会再变，因此默认跳过（结果保留 `map.json` 里的原值）。
`--all-events` 可以强制处理全部活动图——冷缓存下建议先跑一次，
因为模板库里 A1/B1/C2 这类点名主要来自过去的活动图。

常用参数见 `gen-map.js` 顶部注释（`--only`、`--host`、`--refresh` 等）。
下载的资源缓存在 `fcd/.cache-map/`（已 gitignore），重跑不会重复下载。
