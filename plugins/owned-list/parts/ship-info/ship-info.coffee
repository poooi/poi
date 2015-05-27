require 'coffee-react/register'
require 'path'

# Environments
window.ROOT = path.join __dirname ".." ".." ".."

# Shortcuts and Components
window.remote = require 'remote'
window._ = require 'underscore'
window.$ = (param) -> document.querySelector(param)
window.$$ = (param) -> document.querySelectorAll(param)
window.jQuery = require ROOT + '/components/jquery/dist/jquery'
window.React = require 'react'
window.ReactBootstrap = require 'react-bootstrap'