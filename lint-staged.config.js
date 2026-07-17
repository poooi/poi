const lintScripts = ['eslint --fix']
const lintViews = [...lintScripts, 'stylelint']

module.exports = {
  '*.js': lintScripts,
  '*.ts': lintScripts,
  '*.tsx': lintViews,
  '*.css': ['stylelint'],
  '*.md': ['prettier --write'],
}
