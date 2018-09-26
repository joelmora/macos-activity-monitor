const menubar = require('menubar')
const Stats = require('./electron/Stats')
const ImageManager = require('./electron/ImageManager')
const Path = require('path')
const isDev = require('electron-is-dev')
const { ipcMain } = require('electron')
const ev = require('./src/utils/events')

let reactWindow
let stats

const mb = menubar({
  icon: __dirname + '/icons/blank.png',
  preloadWindow: true,
  alwaysOnTop: isDev,
  index: isDev ? 'http://localhost:3000' : Path.join('file://', __dirname, 'build/index.html'),
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
ipcMain.on(ev.INIT_APP, (event) => {
  reactWindow = event.sender
})

/**
 * Change the stats interval
 */
ipcMain.on(ev.INTERVAL_CHANGED, (event, interval) => {
  stats.setInterval(interval)
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
  stats = new Stats(emitEvent)

  imageManager.preloadAll()
    .then(() => {
      stats.setImageManager(imageManager)
      stats.updateStats()
    })

})

mb.on('show', () => {
  if (isDev) {
    mb.window.openDevTools()
  }
})
