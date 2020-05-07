/*
 * The MIT License (MIT)
 *  Copyright (c) 2016 Samuel Attard
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { camelCase, debounce } from 'lodash'
import { events, methods, props, staticProps } from './webview-constants'

export default class ElectronWebView extends Component {
  componentDidMount() {
    this.ready = false
    this.resizeObserver.observe(this.view)
    this.view.addEventListener('did-attach', (...attachArgs) => {
      this.ready = true

      events.forEach((event) => {
        this.view.addEventListener(event, (...eventArgs) => {
          const propName = camelCase(`on-${event}`)
          if (this.props[propName]) this.props[propName](...eventArgs)
        })
      })

      Object.keys(staticProps).forEach((propName) => {
        if (this.props[propName] != null) {
          this.view[propName] = this.props[propName]
        }
      })

      this.view.addEventListener('dom-ready', this.forceSyncZoom)

      this.handleResize([
        {
          contentRect: {
            width: this.view.clientWidth,
            height: this.view.clientHeight,
          },
        },
      ])

      if (this.props.onDidAttach) this.props.onDidAttach(...attachArgs)
    })

    methods.forEach((method) => {
      this[method] = (...args) => {
        if (!this.ready) {
          throw new Error("WebView is not ready yet, you can't call this method")
        }
        return this.view[method](...args)
      }
    })
  }

  componentWillUnmount() {
    this.resizeObserver.unobserve(this.view)
  }

  componentDidUpdate(prevProps) {
    if (this.ready) {
      Object.keys(staticProps).forEach((propName) => {
        if (this.props[propName] !== prevProps[propName]) {
          this.view[propName] = this.props[propName]
        }
      })
    }
  }

  isReady() {
    return this.ready
  }

  forceSyncZoom = () => {
    if (this.props.zoomFactor && this.props.zoomFactor !== this.view.zoomFactor) {
      this.view.zoomFactor = this.props.zoomFactor
    } else if (this.props.zoomLevel && this.props.zoomLevel !== this.view.zoomLevel) {
      this.view.zoomLevel = this.props.zoomLevel
    }
  }

  handleResize = (entries) => {
    if (this.props.onResize) {
      this.props.onResize(entries)
    }
    this.forceSyncZoom()
  }

  resizeObserver = new ResizeObserver(debounce(this.handleResize, 200))

  render() {
    const { style, ...props } = this.props
    return (
      <div style={style || {}}>
        <webview {...props} ref={(view) => (this.view = view)} />
      </div>
    )
  }
}

ElectronWebView.propTypes = Object.assign(
  {
    className: PropTypes.string,
    style: PropTypes.object,
    onResize: PropTypes.func,
  },
  props,
  staticProps,
)

events.forEach((event) => {
  ElectronWebView.propTypes[camelCase(`on-${event}`)] = PropTypes.func
})
