import { ToastContainer, ToastMessageAnimated  } from 'react-toastr'
import { join } from 'path'
import React, { PureComponent } from 'react'
import { toastInitializer } from 'views/env-parts/toast'

const ToastMessageFactory = React.createFactory(ToastMessageAnimated)

class Toastr extends PureComponent {
  componentDidMount = () => {
    toastInitializer(this.container)
  }
  render () {
    return (
      <div>
        <link rel="stylesheet" href={join(__dirname, 'assets', 'toast-animate.css')} />
        <link rel="stylesheet" href={join(__dirname, 'assets', 'toast.css')} />
        <ToastContainer ref={ref => { this.container = ref }}
          toastMessageFactory={ToastMessageFactory}
          className="toast-poi" />
      </div>
    )
  }
}

export { Toastr }
