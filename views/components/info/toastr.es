import { ToastContainer, ToastMessageAnimated  } from 'react-toastr'
import React, { PureComponent } from 'react'
import { toastInitializer } from 'views/env-parts/toast'

import './assets/toast-animate.css'
import './assets/toast.css'

const ToastMessageFactory = React.createFactory(ToastMessageAnimated)

export class Toastr extends PureComponent {
  componentDidMount = () => {
    toastInitializer(this.container)
  }
  render () {
    return (
      <ToastContainer ref={ref => { this.container = ref }}
        toastMessageFactory={ToastMessageFactory}
        className="toast-poi" />
    )
  }
}
