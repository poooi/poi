![Header](https://raw.githubusercontent.com/poooi/poi/master/assets/img/header.png)

[![Build Status](https://travis-ci.org/poooi/poi.svg?branch=master)](https://travis-ci.org/poooi/poi)
[![Build status](https://ci.appveyor.com/api/projects/status/bpa1dvvjt33xxx5n?svg=true)](https://ci.appveyor.com/project/magica/poi)
[![Dependencies](https://david-dm.org/poooi/poi.svg)](https://david-dm.org/poooi/poi)
[![DevDependencies](https://david-dm.org/poooi/poi/dev-status.svg)](https://david-dm.org/poooi/poi#info=devDependencies)

Scalable KanColle browser and tool.

## Prebuilt Release Downloads

GitHub release: [here](https://github.com/poooi/poi/releases).

China mainland mirror: [here](http://0u0.moe/poi).

## Features

+ Proxy
+ Cache
+ Analysis
+ Notification
+ Plugin Support

## Screenshots

![Preview1](https://cloud.githubusercontent.com/assets/6753092/8869050/1c1dd656-3212-11e5-9342-806403b0400d.png)
![Preview2](https://cloud.githubusercontent.com/assets/6753092/8869052/1d19a29c-3212-11e5-8d3a-9bcbd3afef5c.png)
![Preview3](https://cloud.githubusercontent.com/assets/6753092/8869053/1e794caa-3212-11e5-9100-a33559026b6c.png)
![Preview4](https://cloud.githubusercontent.com/assets/6753092/8869055/1f24763e-3212-11e5-9767-048bbc3f2c05.png)
![Preview5](https://cloud.githubusercontent.com/assets/6753092/8869056/1fe883a8-3212-11e5-8745-a042d27be8fd.png)
![Preview6](https://cloud.githubusercontent.com/assets/6753092/8869057/21468a56-3212-11e5-8ac0-71be75b0a668.png)
![Preview7](https://cloud.githubusercontent.com/assets/6753092/8869058/22667b3a-3212-11e5-9f42-17bf3c1ebc0b.png)

## Run

First, get the __latest__ version of [Electron](https://github.com/atom/electron) and [Node.js](https://nodejs.org).

```bash
git clone --recursive https://github.com/poooi/poi && cd poi
git submodule foreach npm i
npm i
./node_modules/.bin/bower install
./node_modules/.bin/gulp
cp default-config.cson config.cson
./node_modules/electron-prebuilt/dist/electron ./
```

## Available Plugins
[plugin-prophet (Bundled)](https://github.com/poooi/plugin-prophet) by [Chiba](https://github.com/Chibaheit)
> Show the result of battle.

[plugin-exp-calculator (Bundled)](https://github.com/poooi/plugin-exp-calculator) by [Chiba](https://github.com/Chibaheit)
> Calculate experience value.

[plugin-map-hp (Bundled)](https://github.com/poooi/plugin-map-hp) by [Chiba](https://github.com/Chibaheit)
> a plugin map hp for poi.

[plugin-report (Bundled)](https://github.com/poooi/plugin-report) by [Magica](https://github.com/magicae)
> Report ship creating info and drop info, and so on.

[plugin-expedition (Bundled)](https://github.com/poooi/plugin-expedition) by [Malichan](https://github.com/malichan)
> Show expedition info.

[plugin-quest (Bundled)](https://github.com/poooi/plugin-quest) by [Malichan](https://github.com/malichan)
> Show quest info.

[plugin-item-improvement (Bundled)](https://github.com/poooi/plugin-item-improvement) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Show improvable items of the day.

[plugin-ship-info (Bundled)](https://github.com/poooi/plugin-ship-info) by [Yunze](https://github.com/myzwillmake)
> Show detailed information of all owned ships.

[plugin-item-info (Bundled)](https://github.com/poooi/plugin-item-info) by [Yunze](https://github.com/myzwillmake)
> Show information of all owned items.

[plugin-new-window (Bundled)](https://github.com/poooi/plugin-new-window) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Open a external browser window.

[plugin-Akashic-records (Bundled)](https://github.com/poooi/plugin-Akashic-records) by [JenningsWu](https://github.com/JenningsWu)
> Logbook plugin for poi.

[plugin-almanac](https://github.com/poooi/plugin-almanac) by [Magica](https://github.com/magicae)
> KanColle almanac from http://sandbox.runjs.cn/show/x9ou86rn

[plugin-repair](https://github.com/Ayaphis/plugin-repair) by [Ayaphis](https://github.com/Ayaphis)
> Calculate the time required of repair.

[plugin-secretary](https://github.com/dazzyd/poi-secretary) by [Dazzy Ding](https://github.com/dazzyd)
> Use secretary voice as notification sound.

[plugin-hensei-nikki](https://github.com/poooi/plugin-hensei-nikki.git) by [Rui](https://github.com/ruiii)
> Record fleet config once sortied.

## Guides for developers

About plugin, read the [docs](https://github.com/poooi/poi/tree/master/docs).

## Based on

+ [Electron](https://github.com/atom/electron)
+ [React](https://github.com/facebook/react)
+ [ReactBootstrap](https://github.com/react-bootstrap/react-bootstrap/)
+ [Shadowsocks](https://github.com/shadowsocks/shadowsocks)

## License
[The MIT License](https://github.com/poooi/poi/blob/master/LICENSE)
