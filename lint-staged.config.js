module.exports = {
  '*.es': ['eslint --fix', 'stylelint --config .stylelintrc.js'],
  '*.js': ['eslint --fix'],
  '*.css': ['stylelint --config .stylelintrc.js'],
  '*.md': ['prettier --write'],
}
