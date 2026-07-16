// Options for babel-hook.js (poi's in-process replacement for @babel/register;
// see the rationale in that file). The babel config is referenced as a file
// path rather than spread here so the hook and any external tooling load the
// exact same config.
module.exports = {
  configFile: require.resolve('./babel.config.js'),
  babelrc: false,
  only: [/\.(es|ts|tsx)$/],
  ignore: [],
  extensions: ['.es', '.ts', '.tsx'],
  cache: false,
}
