require 'coffee-react/register'

# Environments
window.ROOT = __dirname

# Shortcuts and Components
window.remote = require 'remote'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require './components/jquery/dist/jquery'
window.React = require 'react'
window.ReactBootstrap = require 'react-bootstrap'

# Node modules
window.config = remote.require './lib/config'
window.proxy = remote.require './lib/proxy'

# User configs
window.layout = config.get 'poi.layout', 'horizonal'

views = ['layout', 'app']
plugins = []
for view in views
  require "./views/#{view}"
for plugin in plugins
  require "./plugins/#{plugin}/index"
