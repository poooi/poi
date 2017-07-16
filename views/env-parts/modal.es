const modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer, onExiting) =>{
  modals.push({
    title: title,
    content: content,
    footer: footer,
    onExiting: onExiting,
  })
  if (!window.modalLocked) {
    window.showModal()
  }
}
window.showModal = () => {
  if (modals.length === 0) {
    return
  }
  const {title, content, footer, onExiting} = modals.shift()
  const e = new CustomEvent('poi.modal', {
    bubbles: true,
    cancelable: true,
    detail: {
      title: title,
      content: content,
      footer: footer,
      onExiting: onExiting,
    },
  })
  window.dispatchEvent(e)
}
