# Command Line Arguments

You are able to use command line arguments for certain purpose.

Example:
```sh
electron poi --dev --dev-extra extraA extraB
```

Available options:

| short | full | description|
|-|-|-|
|-v|--version|shows the version|
|-d|--dev|enables debug mode|
|--extra|--dev-extra| extra debug option, usage `--dev-extra extraA extraB`|
|-s|--safe|enables safe mode, reset the redux store and disables all plugins|
|-h|--help|prints the cli help|


## Available Extras

| Name | Listed | Description |
|------|:------:|-------------|
| brk              | ❌ | Adds a breakpoint before any code in app.es is executed |
| gameResponse     | ⭕️ | Logs game response packages|
| i18next          | ⭕️ | i18next debug mode |
| i18next-save-missing | ⭕️  | save missing keys |

_Note: there's no guarantee that this table is complete (especially the options used in plugins may be neglected). It is always a good idea to do a search in the source code or discuss with other developers_
