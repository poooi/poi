// Faster align setting
const alignCSS = document.createElement('style')
alignCSS.innerHTML = `html {
  overflow: hidden;
}
#w, #main-ntg {
  position: absolute !important;
  top: 0;
  left: 0;
  z-index: 100;
  margin-left: 0 !important;
  margin-top: 0 !important;
}
#game_frame {
  width: 1200px !important;
  position: absolute;
  top: 0px;
  left: 0;
}
.naviapp {
  z-index: -1;
}
#ntg-recommend {
  display: none !important;
}
#spacing_top {
  display: none;
}
#alert {
  left: 270px !important;
  top: 83px !important;
  border: 0;
}
`

window.align = function () {
  if (
    location.pathname.includes('854854') ||
    location.hostname === 'osapi.dmm.com' ||
    location.pathname.includes('kcs')
  ) {
    document.body.appendChild(alignCSS)
    window.scrollTo(0, 0)
  }
}

window.unalign = () => {
  if (document.body.contains(alignCSS)) {
    document.body.removeChild(alignCSS)
  }
}

const handleDocumentReady = () => {
  if (!document.body) {
    setTimeout(handleDocumentReady, 1000)
    return
  }
  window.align()
}

handleDocumentReady()
