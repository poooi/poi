const template = ({ template }, opts, { imports, componentName, props, jsx, exports }) =>
  template.ast`
    ${imports}
    const Icon = (${props}) => ${jsx}
    export default Icon
  `

module.exports = template
