document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (!['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(e?.target?.tagName)) {
      e.preventDefault()
    } else if (
      e?.target?.baseURI?.includes('kancolle-server') ||
      e?.target?.baseURI?.includes('kcsapi')
    ) {
      e.preventDefault()
    }
  }
})
