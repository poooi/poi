document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e?.target?.tagName !== 'INPUT' && e?.target?.tagName !== 'TEXTAREA') {
      e.preventDefault()
    } else if (
      e?.target?.baseURI?.includes('kancolle-server') ||
      e?.target?.baseURI?.includes('kcsapi')
    ) {
      e.preventDefault()
    }
  }
})
