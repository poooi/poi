const { writeFile } = require('fs-extra')

const portList = []

// eslint-disable-next-line no-undef
onconnect = function(e) {
  const currentPort = e.ports[0]
  portList.push(currentPort)
  currentPort.addEventListener('message', e => {
    const data = [...e.data]
    const type = data.shift()
    switch (type) {
    case 'WriteFile': {
      let [path, content] = data
      if (typeof content !== 'string') {
        content = JSON.stringify(content)
      }
      writeFile(path, content)
      break
    }
    case 'Disconnect': {
      portList.splice(portList.indexOf(currentPort), 1)
      break
    }
    }
  })
  currentPort.start()
}
