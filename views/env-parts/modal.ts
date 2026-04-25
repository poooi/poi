import type { ReactNode } from 'react'
import type { ButtonData } from 'views/components/etc/modal'

import { modalEventEmitter } from 'views/components/etc/modal'

export const toggleModal = (
  title: string,
  content: ReactNode,
  footer: ButtonData[],
  onClosing?: () => void,
) => {
  modalEventEmitter.emit({
    title,
    content,
    footer,
    onClosing,
  })
}

declare global {
  interface Window {
    toggleModal: (
      title: string,
      content: ReactNode,
      footer: ButtonData[],
      onClosing?: () => void,
    ) => void
  }
}
window.toggleModal = toggleModal
