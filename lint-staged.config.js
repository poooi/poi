module.exports = {
  '*.{es,js}': ['eslint --fix', 'stylelint --config .stylelintrc.styled.js', 'git add'],
  '*.css': ['stylelint --config .stylelint.css.js'],
}
