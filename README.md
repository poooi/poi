![Header](https://raw.githubusercontent.com/poooi/poi/master/assets/img/header.png)

[![Build Status](https://travis-ci.org/poooi/poi.svg?branch=master)](https://travis-ci.org/poooi/poi)
[![Backers on Open Collective](https://opencollective.com/poi/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/poi/sponsors/badge.svg)](#sponsors) [![Build status](https://ci.appveyor.com/api/projects/status/apv2xngtej1m17he?svg=true)](https://ci.appveyor.com/project/KochiyaOcean/poi)
[![Dependencies](https://david-dm.org/poooi/poi.svg)](https://david-dm.org/poooi/poi)
[![DevDependencies](https://david-dm.org/poooi/poi/dev-status.svg)](https://david-dm.org/poooi/poi?type=dev)
[![license:mit](https://img.shields.io/badge/license-mit-blue.svg)](https://opensource.org/licenses/MIT)

Scalable KanColle browser and tool.

## Prebuilt Release Downloads

[GitHub release](https://github.com/poooi/poi/releases).

[cnpm (CN Mainland)](https://npm.taobao.org/mirrors/poi).

### UNOFFICIAL releases maintained by the community

[AUR (Arch Linux, maintained by @swordfeng)](https://aur.archlinux.org/packages/poi/).

Homebrew Cask (macOS, maintained by @darg20127).
```shell
brew update && brew cask install poi
```

## Features

+ Proxy
+ Cache
+ Analysis
+ Notification
+ Plugin Support

## Screenshots

![Preview 1](https://cloud.githubusercontent.com/assets/6753092/10863967/ebcc2b60-8018-11e5-9f74-9d0cf214fe49.png)
![Preview 2](https://cloud.githubusercontent.com/assets/6753092/10863968/ee4d8a96-8018-11e5-92ae-7f794864dca8.png)
![Preview 3](https://cloud.githubusercontent.com/assets/6753092/10863969/f0a49b2c-8018-11e5-9659-43f626c4691c.png)
![Preview 4](https://cloud.githubusercontent.com/assets/6753092/10863970/f19f7ec0-8018-11e5-99f8-8df3bced1616.png)
![Preview 5](https://cloud.githubusercontent.com/assets/6753092/10863971/f2a69114-8018-11e5-8b4e-3017472a24a4.png)
![Preview 6](https://cloud.githubusercontent.com/assets/6753092/10863972/f3c3a898-8018-11e5-9aa6-0049a879e0bc.png)
![Preview 7](https://cloud.githubusercontent.com/assets/6753092/10863973/f56bddb4-8018-11e5-82c1-4d1fc23779a8.png)
![Preview 8](https://cloud.githubusercontent.com/assets/6753092/10863975/f70264ae-8018-11e5-8b71-2fb9a78819d5.png)
![Preview 9](https://cloud.githubusercontent.com/assets/6753092/10863976/f8458094-8018-11e5-9164-c9127fee9257.png)

## Run

First, get the __latest__ __x64__ version (__>= 7.6.x__) of [Node.js](https://nodejs.org) and [npm](https://npmjs.org) >= __5.0.x__.

``` shell
git clone https://github.com/poooi/poi && cd poi
npm install
npm run deploy
npm start
```

Tips:
- You do not have to run `npm install` and `npm run deploy` with every `git pull`, however they're recommended after a major version bump. In case of any dependency or `require` error, try re-running them.

- If you have installed packages with npm < 5.0, it is highly recommended to completely remove current `node_modules` folder and re-run `npm install`.

- If you have trouble downloading electron executables from github/amazonaws, [you may set ELECTRON_MIRROR environment variable](https://github.com/electron-userland/electron-download).

## Available Plugins
[plugin-prophet](https://github.com/poooi/plugin-prophet) by [Chiba](https://github.com/Chibaheit)
> Show the result of battle.

[plugin-exp-calculator](https://github.com/poooi/plugin-exp-calculator) by [Chiba](https://github.com/Chibaheit)
> Calculate experience value.

[plugin-map-hp](https://github.com/poooi/plugin-map-hp) by [Chiba](https://github.com/Chibaheit)
> a plugin map hp for poi.

[plugin-report](https://github.com/poooi/plugin-report) by [Magica](https://github.com/magicae)
> Report ship creating info and drop info, and so on.

[plugin-expedition](https://github.com/poooi/plugin-expedition) by [Malichan](https://github.com/malichan)
> Show expedition info.

[plugin-quest](https://github.com/poooi/plugin-quest) by [Malichan](https://github.com/malichan)
> Show quest info.

[plugin-item-improvement](https://github.com/poooi/plugin-item-improvement) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Show improvable items of the day.

[plugin-ship-info](https://github.com/poooi/plugin-ship-info) by [Yunze](https://github.com/myzwillmake)
> Show detailed information of all owned ships.

[plugin-item-info](https://github.com/poooi/plugin-item-info) by [Yunze](https://github.com/myzwillmake)
> Show information of all owned items.

[plugin-new-window](https://github.com/poooi/plugin-new-window) by [KochiyaOcean](https://github.com/KochiyaOcean)
> Open a external browser window.

[plugin-Akashic-records](https://github.com/poooi/plugin-Akashic-records) by [JenningsWu](https://github.com/JenningsWu)
> Logbook plugin for poi.

[plugin-battle-detail](https://github.com/poooi/plugin-battle-detail) by [Dazzy Ding](https://github.com/yukixz)
> Show battle detail.

[plugin-hensei-nikki](https://github.com/poooi/plugin-hensei-nikki.git) by [Rui](https://github.com/ruiii)
> Record fleet config once sortied.

[plugin-almanac](https://github.com/poooi/plugin-almanac) by [Magica](https://github.com/magicae)
> KanColle almanac from http://sandbox.runjs.cn/show/x9ou86rn

[plugin-repair](https://github.com/Ayaphis/plugin-repair) by [Ayaphis](https://github.com/Ayaphis)
> Calculate the time required of repair.

[plugin-secretary](https://github.com/dazzyd/poi-secretary) by [Dazzy Ding](https://github.com/yukixz)
> Use secretary voice as notification sound.

[plugin-hairstrength](https://github.com/ruiii/plugin-hairstrength.git) by [Rui](https://github.com/ruiii)
> Senka calculator.

[plugin-anchorage-repair](https://github.com/KagamiChan/plugin-anchorage-repair.git) by [かがみ](https://github.com/KagamiChan)
> Helper for akashi repair

[plugin-ezexped](https://github.com/poooi/poi-plugin-ezexped) by [Javran](https://github.com/Javran)
> Expedition made easy

## Contributing

Bug reports, suggestions, ideas, pull requests, and devs are always welcome :)

On plugin development, the [docs](https://github.com/poooi/poi/tree/master/docs) are available in Chinese and English.

Please feel free to contact us via github issues, [telegram group](https://telegram.me/joinchat/AoMUpkCr6B8uH7EUewq6eQ), QQ group, weibo or anything else.


## Based on

+ [Electron](https://github.com/atom/electron)
+ [React](https://github.com/facebook/react)
+ [ReactBootstrap](https://github.com/react-bootstrap/react-bootstrap/)
+ [Redux](https://github.com/reactjs/redux)

## Contributors

This project exists thanks to all the people who contribute.
<a href="graphs/contributors"><img src="https://opencollective.com/poi/contributors.svg?width=890" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/poi#backer)]

<a href="https://opencollective.com/poi#backers" target="_blank"><img src="https://opencollective.com/poi/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/poi#sponsor)]

<a href="https://opencollective.com/poi/sponsor/0/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/1/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/2/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/3/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/4/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/5/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/6/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/7/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/8/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/poi/sponsor/9/website" target="_blank"><img src="https://opencollective.com/poi/sponsor/9/avatar.svg"></a>



## License
[The MIT License](https://github.com/poooi/poi/blob/master/LICENSE)
