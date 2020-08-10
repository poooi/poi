import React, { PureComponent } from 'react'
import { withNamespaces } from 'react-i18next'
import { Dialog, Button, Classes } from '@blueprintjs/core'
import { size } from 'lodash'
import cls from 'classnames'

// Notification modal
@withNamespaces()
export class ModalTrigger extends PureComponent {
  state = {
    isModalOpen: false,
    title: null,
    content: null,
  }

  handleToggle = () => {
    window.modalLocked = false
    this.setState({
      isModalOpen: false,
    })
    window.showModal()
  }

  handleModal = (e) => {
    window.modalLocked = true
    this.setState({
      isModalOpen: true,
      title: e.detail.title,
      content: e.detail.content,
      footer: e.detail.footer,
      onClosing: e.detail.onClosing || e.detail.onExiting, // FIXME: button.style for rb backward compat
    })
  }

  componentDidMount = () => {
    window.addEventListener('poi.modal', this.handleModal)
  }

  componentWillUnmount = () => {
    window.removeEventListener('poi.modal', this.handleModal)
  }

  renderFooter = (footer) => {
    if (size(footer) === 0) {
      return
    }
    return footer.map((button, index) => {
      return (
        <Button
          key={index}
          onClick={(e) => {
            this.handleToggle()
            button.func(e)
          }}
          intent={button.intent || button.style} // FIXME: button.style for rb backward compat
        >
          {button.name}
        </Button>
      )
    })
  }

  render() {
    const { t } = this.props
    const { isModalOpen, onClosing, title, content, footer } = this.state
    return (
      <Dialog
        isCloseButtonShown
        autoFocus={true}
        animation={true}
        isOpen={isModalOpen}
        onClose={this.handleToggle}
        onClosing={onClosing}
        title={title}
      >
        <div className={Classes.DIALOG_BODY}>{content}</div>
        <div className={cls(Classes.DIALOG_FOOTER, 'dialog-footer')}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={this.handleToggle}>
              {size(footer) === 0 ? t('Close') : t('Cancel')}
            </Button>
            {this.renderFooter(footer)}
          </div>
        </div>
      </Dialog>
    )
  }
}
