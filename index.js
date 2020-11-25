try {
  require('./lib/cli')
} catch (e) {
  require('@babel/register')(require('./babel-register.config'))
  require('./lib/cli')
} finally {
  require('./app')
}
