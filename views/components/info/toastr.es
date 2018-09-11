import React from 'react'
import ReduxToastr from 'react-redux-toastr'

import 'react-redux-toastr/lib/css/react-redux-toastr.min.css'

export function Toastr() {
  return (
    <ReduxToastr
      timeOut={5000}
      newestOnTop={true}
      position="bottom-right"
      transitionIn="fadeIn"
      transitionOut="fadeOut"
      progressBar
      closeOnToastrClick />
  )
}
