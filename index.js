require('coffee-script/register')
require('@babel/register')(require('./babel.config'))
require('./lib/cli')
require('./app')
