![Header](https://raw.githubusercontent.com/yudachi/poi/master/assets/img/header.png)

[![Build Status](https://travis-ci.org/yudachi/poi.svg?branch=master)](https://travis-ci.org/yudachi/poi)
[![Build status](https://ci.appveyor.com/api/projects/status/bpa1dvvjt33xxx5n?svg=true)](https://ci.appveyor.com/project/magica/poi)
[![Dependencies](https://david-dm.org/yudachi/poi.svg)](https://david-dm.org/yudachi/poi)
[![DevDependencies](https://david-dm.org/yudachi/poi/dev-status.svg)](https://david-dm.org/yudachi/poi#info=devDependencies)

Scalable KanColle browser and tool.

## Features

+ Proxy
+ Cache
+ Analysis
+ Notification
+ Plugin Support

## Run

First, get the latest version of [Electron](https://github.com/atom/electron) and [io.js](https://iojs.org).

```bash
git clone https://github.com/yudachi/poi
cd poi
git submodule init
git submodule update
npm install
./node_modules/.bin/bower install
./node_modules/.bin/gulp
cp default-config.cson config.cson
/path/to/electron ./
```

## Available Plugins
[plugin-prophet (Bundled)](https://github.com/yudachi/plugin-prophet) by [Chiba](https://github.com/Chibaheit)
> Show the result of battle.

[plugin-exp-calculator (Bundled)](https://github.com/yudachi/plugin-exp-calculator) by [Chiba](https://github.com/Chibaheit)
> Calculate experience value.

[plugin-map-hp (Bundled)](https://github.com/yudachi/plugin-map-hp) by [Chiba](https://github.com/Chibaheit)
> a plugin map hp for poi.

[plugin-report (Bundled)](https://github.com/yudachi/plugin-report) by [Magica](https://github.com/magicae)
> Report ship creating info and drop info, and so on.

[plugin-expedition (Bundled)](https://github.com/yudachi/plugin-expedition) by [malichan](https://github.com/malichan)
> Show expedition info.

[plugin-item-improvement (Bundled)](https://github.com/yudachi/plugin-item-improvement) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Show improvable items of the day.

[plugin-ship-info (Bundled)](https://github.com/yudachi/plugin-ship-info) by [Yunze](https://github.com/myzwillmake)
> Show detailed information of all owned ships.

[plugin-item-info (Bundled)](https://github.com/yudachi/plugin-item-info) by [Yunze](https://github.com/myzwillmake)
> Show information of all owned items.

[plugin-new-window (Bundled)](https://github.com/yudachi/plugin-new-window) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Open a external browser window.

[plugin-Akashic-records (Bundled)](https://github.com/yudachi/plugin-Akashic-records) by [JenningsWu](https://github.com/JenningsWu)
> Logbook plugin for poi.

[plugin-almanac](https://github.com/yudachi/plugin-almanac) by [Magica](https://github.com/magicae)
> KanColle almanac from http://sandbox.runjs.cn/show/x9ou86rn

[plugin-sunshine](https://github.com/yudachi/plugin-sunshine) by [JenningsWu](https://github.com/JenningsWu)
> poi~ shine you one face!

[plugin-repair](https://github.com/Ayaphis/plugin-repair) by [Ayaphis](https://github.com/Ayaphis)
> Calculate the time required of repair.

[plugin-ship-panel-patcher](https://github.com/yudachi/plugin-ship-panel-patcher) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Use an alter style of ship panel.

## Guides for developers

About plugin, read the [docs](https://github.com/yudachi/poi/tree/master/docs).

## Based on

+ [Electron](https://github.com/atom/electron)
+ [React](https://github.com/facebook/react)
+ [ReactBootstrap](https://github.com/react-bootstrap/react-bootstrap/)
+ [Shadowsocks](https://github.com/shadowsocks/shadowsocks)

## License
[The MIT License](https://github.com/yudachi/poi/blob/master/LICENSE)
