require 'coffee-react/register'
window.ROOT = __dirname
window.remote = require 'remote'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require './components/jquery/dist/jquery'
window.React = require 'react'
window.ReactBootstrap = require 'react-bootstrap'

views = ['layout', 'app']
plugins = []
for view in views
  require "./views/#{view}"
for plugin in plugins
  require "./plugins/#{plugin}/index"
