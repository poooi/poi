const modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer, onClosing) => {
  modals.push({
    title: title,
    content: content,
    footer: footer,
    onClosing,
  })
  if (!window.modalLocked) {
    window.showModal()
  }
}
window.showModal = () => {
  if (modals.length === 0) {
    return
  }
  const { title, content, footer, onClosing } = modals.shift()
  const e = new CustomEvent('poi.modal', {
    bubbles: true,
    cancelable: true,
    detail: {
      title: title,
      content: content,
      footer: footer,
      onClosing,
    },
  })
  window.dispatchEvent(e)
}
