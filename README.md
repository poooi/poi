# poi
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
+ Extension Support

## Run

First, get [Electron](https://github.com/atom/electron) **v0.26.1** and [io.js](https://iojs.org).

```bash
git clone https://github.com/yudachi/poi
cd poi
npm install
./node_modules/.bin/bower install
./node_modules/.bin/gulp
cp default-config.json config.json
/path/to/electron ./
```


## Roadmap

Refer to https://github.com/yudachi/poi/issues/1

## Based on

+ [Electron](https://github.com/atom/electron)
+ [React](https://github.com/facebook/react)
+ [ReactBootstrap](https://github.com/react-bootstrap/react-bootstrap/)
+ [Shadowsocks](https://github.com/shadowsocks/shadowsocks)

## Contributing

Don't push directly to master.

## License
[The MIT License](https://github.com/yudachi/poi/blob/master/LICENSE)
