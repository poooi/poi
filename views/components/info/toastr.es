import { ToastContainer, ToastMessage } from 'react-toastr'
import { join } from 'path'
import React from 'react'

const ToastMessageFactory = React.createFactory(ToastMessage.animation)

class Toastr extends React.Component {
  componentDidMount = () => {
    window.toastInitializer(this.refs.container)
  }
  render () {
    return (
      <div>
      <link rel="stylesheet" href={join(__dirname, 'assets', 'toast-animate.css')} />
      <link rel="stylesheet" href={join(__dirname, 'assets', 'toast.css')} />
        <ToastContainer ref="container"
                        toastMessageFactory={ToastMessageFactory}
                        className="toast-poi" />
      </div>
    )
  }
}

export { Toastr }
