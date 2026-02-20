const lintScripts = ['eslint --fix']
const lintViews = [...lintScripts, 'stylelint']

module.exports = {
  '*.js': lintScripts,
  '*.ts': lintScripts,
  '*.es': lintViews,
  '*.tsx': lintViews,
  '*.css': ['stylelint'],
  '*.md': ['prettier --write'],
}
