import React, { PureComponent } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { translate } from 'react-i18next'

// Notification modal
@translate()
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
      onExiting: e.detail.onExiting,
    })
  }
  componentDidMount = () => {
    window.addEventListener('poi.modal', this.handleModal)
  }
  componentWillUnmount = () => {
    window.removeEventListener('poi.modal', this.handleModal)
  }
  renderFooter = (footer) =>{
    if (!((typeof footer !== "undefined" && footer !== null) && (footer.length != null) && footer.length > 0)) {
      return
    }
    return footer.map((button, index) => {
      return (
        <Button key={index} onClick={
          (e) => {
            this.handleToggle()
            button.func()
          }
        } bsStyle={button.style}>{button.name}</Button>
      )
    })
  }
  render() {
    const { t } = this.props
    return (
      <Modal autoFocus={true}
        animation={true}
        show={this.state.isModalOpen}
        onHide={this.handleToggle}
        onExiting={this.state.onExiting}>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.state.content}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleToggle}>
            {
              (this.state.footer || []).length === 0 ? t('Close') : t('Cancel')
            }
          </Button>
          {this.renderFooter(this.state.footer)}
        </Modal.Footer>
      </Modal>
    )
  }
}
