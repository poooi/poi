# Command Line Arguments

You are able to use command line arguments for certain purpose.

Example:  
```sh
electron poi --debug --debug-extra=opt1,opt2,opt3
```

## General

* `--version | -v` print version information, then exit.

## Debugging

* `--debug[=true|false]` enable/disable debug mode.  
`--debug` and `-d` are identical to `--debug=true`.
* `--debug-extra=option1[,option2[,...]]` *enable* extra debug option(s). Different options should be separated by commas (',').
* `--debug-extra-d=option1[,option2[,...]]` *disable* extra debug option(s). Different options should be separated by commas (',').

It is possible to use the debugging arguments multiple times. They will be processed from left to right. For example:  
`--debug-extra=a,b,c --debug-extra-d=b --debug-extra=d`  
will enable extra debug options `a`, `c` and `d`

### Known Extra Debug Options

| Name | Listed | Description |
|------|:------:|-------------|
| brk              | ❌ | Adds a breakpoint before any code in app.cjsx is executed |
| gameResponse     | ⭕️ | Logs game response packages|
| moduleRenderCost | ⭕️ | Logs the time cost when loading certain modules |
_Note: there's no guarantee that this table is complete (especially the options used in plugins may be neglected). It is always a good idea to do a search in the source code or discuss with other developers_
