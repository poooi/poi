module.exports = {
  '*.{es,js}': ['eslint --fix', 'stylelint --config .stylelintrc.styled.js', 'git add'],
  '*.css': ['stylelint --config .stylelintrc.css.js'],
  '*.md': ['prettier --write', 'git add'],
}
