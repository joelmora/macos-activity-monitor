const menubar = require('menubar')
const Stats = require('./Stats')
const ImageManager = require('./ImageManager')
const Path = require('path')
const { ipcMain } = require('electron')

const mb = menubar({
  icon: __dirname + '/icons/blank.png',
  preloadWindow: true,
  index: 'http://localhost:3000',
  alwaysOnTop: true,
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
 * Send event to other processes
 * @param {*} event 
 * @param {*} data 
 */
const emitEvent = (event, data) => {
  // console.log(mb.window.webContents)
  // mb.window.webContents.send(event, data)
  // ipcMain.emit(event, data)
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

mb.on('after-hide', () => {
  //FIXME glich that set 2 graphics on top of each other
  mb.window = null
})