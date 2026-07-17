// Options for babel-hook.js (poi's in-process replacement for @babel/register;
// see the rationale in that file). The babel config is referenced as a file
// path rather than spread here so the hook and any external tooling load the
// exact same config.
// .es stays registered even though poi's own sources are all .ts/.tsx now:
// third-party plugins loaded through this hook may still ship .es files.
module.exports = {
  configFile: require.resolve('./babel.config.js'),
  babelrc: false,
  only: [/\.(es|ts|tsx)$/],
  ignore: [],
  extensions: ['.es', '.ts', '.tsx'],
  cache: false,
}
