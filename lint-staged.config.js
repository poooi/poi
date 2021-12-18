const lintScripts = ['eslint --fix']
const lintViews = [...lintScripts, 'stylelint --config .stylelintrc.js']

module.exports = {
  '*.js': lintScripts,
  '*.ts': lintScripts,
  '*.es': lintViews,
  '*.tsx': lintViews,
  '*.css': ['stylelint --config .stylelintrc.js'],
  '*.md': ['prettier --write'],
}
