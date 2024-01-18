import { ReactNode } from 'react'
import { ButtonData, modalEventEmitter } from 'views/components/etc/modal'

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

// @ts-expect-error backward compatibility
window.toggleModal = toggleModal
