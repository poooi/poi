# poi-plugin-ooi-autofill

在 poi 里记录 OOI 登录页的账号和密码，并在地址匹配的 OOI 登录页自动填入。

凭据只写入本机 poi 配置，不会上传。插件不会自动点击「登录游戏」。

## 安装

把本目录联接到 poi 的插件目录后重启 poi：

```bat
mkdir "%APPDATA%\poi\plugins\node_modules"
mklink /J "%APPDATA%\poi\plugins\node_modules\poi-plugin-ooi-autofill" "%CD%\plugins\poi-plugin-ooi-autofill"
```

在仓库根目录执行上面的命令。然后打开 poi 的插件设置，填写登录 ID 和密码。站点地址默认是 `ooi.moe`。

也可以在已经打开的 OOI 登录页点击「从当前登录页读取」。

站点地址留空时不会自动填入。只有主机名完全一致、且页面含有 `#ooi-form` 时，才会写入 `#login_id` 和 `#password`。
