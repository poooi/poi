try {
  require('./lib/cli')
} catch (_e) {
  require('@babel/register')(require('./babel-register.config'))
  require('./lib/cli')
} finally {
  require('./app')
}
