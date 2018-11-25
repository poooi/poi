try {
  require('./lib/cli')
} catch (e) {
  require('@babel/register')(require('./babel.config'))
  require('./lib/cli')
} finally {
  require('./app')
}
