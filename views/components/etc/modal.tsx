import type { Intent } from '@blueprintjs/core'
import type { ReactNode } from 'react'

import { Dialog, Button, DialogBody, DialogFooter } from '@blueprintjs/core'
import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { EventEmitter } from 'views/utils/event-emitter'

export interface ButtonData {
  name: string
  func: (e: React.MouseEvent<HTMLElement>) => void
  intent?: Intent
  // for backward compatibility
  style?: Intent
}

export interface ModalEvent {
  title: string
  content: ReactNode
  footer: ButtonData[]
  onClosing?: () => void
}

export const modalEventEmitter = new EventEmitter<ModalEvent>()

// Notification modal
const ModalTrigger: React.FC = () => {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modals, setModals] = useState<ModalEvent[]>([])

  const handleNextModal = useCallback(() => {
    setIsModalOpen(false)
    setModals((prev) => prev.slice(1))
  }, [])

  const handleNewModal = useCallback((e: ModalEvent) => {
    setModals((prev) => [...prev, e])
  }, [])

  useEffect(() => {
    modalEventEmitter.on(handleNewModal)
    return () => {
      modalEventEmitter.off(handleNewModal)
    }
  }, [handleNewModal])

  useEffect(() => {
    setTimeout(() => {
      setIsModalOpen(modals.length > 0)
    }, 100)
  }, [modals])

  const renderFooter = (footer: ButtonData[]): ReactNode => {
    if (footer.length === 0) {
      return null
    }
    return footer.map((button, index) => {
      return (
        <Button
          key={index}
          onClick={(e) => {
            handleNextModal()
            button.func(e)
          }}
          intent={button.intent || button.style}
        >
          {button.name}
        </Button>
      )
    })
  }

  const currentModal = modals[0]

  const { title = '', content = '', footer = [], onClosing } = currentModal || {}

  return (
    <Dialog
      isCloseButtonShown
      autoFocus
      isOpen={isModalOpen}
      onClose={handleNextModal}
      onClosing={onClosing}
      title={title}
    >
      <DialogBody>{content}</DialogBody>
      <DialogFooter
        minimal
        actions={
          <>
            <Button onClick={handleNextModal}>
              {footer.length === 0 ? t('Close') : t('Cancel')}
            </Button>
            {renderFooter(footer)}
          </>
        }
      />
    </Dialog>
  )
}

export default ModalTrigger
