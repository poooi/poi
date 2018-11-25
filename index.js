if (require.resolve('./lib/cli').endsWith('es')) {
  require('@babel/register')(require('./babel.config'))
}
require('./lib/cli')
require('./app')
