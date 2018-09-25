const menubar = require('menubar')
const Stats = require('./Stats')
const ImageManager = require('./ImageManager')
const Path = require('path')
const { ipcMain } = require('electron')

let reactWindow

const mb = menubar({
  icon: __dirname + '/icons/blank.png',
  preloadWindow: true,
  index: 'http://localhost:3000',
  // alwaysOnTop: true,
  // index: Path.join('file://', __dirname, 'build/index.html')
  // index: process.env.ENV === 'dev' ? 'http://localhost:9000' : Path.join('file://', __dirname, 'build/index.html'),
})

/**
 * Sets icons on the tray
 * @param {*} icon 
 * @param {*} iconInverted 
 */
const setTrayImage = (icon, iconInverted) => {
  mb.tray.setImage(icon)
  mb.tray.setPressedImage(iconInverted)
}

/**
 * Receive the active windows to be able to send events to that windows
 */
ipcMain.on('init-renderer', (event) => {
  reactWindow = event.sender
})

/**
 * Send event to other processes
 * @param {*} event 
 * @param {*} data 
 */
const emitEvent = (event, data) => {
  if (reactWindow) {
    reactWindow.send(event, data)
  }
}

//main
mb.on('ready', () => {
  console.log('app is ready')

  let imageManager = new ImageManager(setTrayImage)
  let stats = new Stats(emitEvent)

  imageManager.preloadAll()
    .then(() => {
      stats.setImageManager(imageManager)
      stats.updateStats()
    })

})

mb.on('show', () => {
  // mb.window.openDevTools()
})

mb.on('after-hide', () => {
  //FIXME glich that set 2 graphics on top of each other
  mb.window = null
})