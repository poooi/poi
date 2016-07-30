const modals = []
window.modalLocked = false
window.toggleModal = (title, content, footer) =>{
  modals.push({
    title: title,
    content: content,
    footer: footer,
  })
  if (!window.modalLocked) {
    window.showModal()
  }
}
window.showModal = () => {
  if (modals.length === 0) {
    return
  }
  const {title, content, footer} = modals.shift()
  const e = new CustomEvent('poi.modal', {
    bubbles: true,
    cancelable: true,
    detail: {
      title: title,
      content: content,
      footer: footer,
    },
  })
  window.dispatchEvent(e)
}
