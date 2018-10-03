const menubar = require('menubar')
const Store = require('electron-store')
const Stats = require('./electron/Stats')
const ImageManager = require('./electron/ImageManager')
const Path = require('path')
const isDev = require('electron-is-dev')
const { ipcMain, app } = require('electron')
const ev = require('./src/utils/events')

const store = new Store({
  name: 'user-preferences',
  defaults: {
    interval: 2000,
    indicators: [
      { name: 'CPU', short: 'cpu', isOn: true, color: '#36a2eb', showColorPicker: undefined },
      { name: 'Memory', short: 'mem', isOn: true, color: '#36eb7f', showColorPicker: undefined },
    ],
  }
})

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
 * Send event to other processes
 */
const emitEvent = (event, data) => {
  if (reactWindow) {
    reactWindow.send(event, data)
  } else {
    setTimeout(() => {
      emitEvent(event, data)
    }, 100)
  }
}

/**
 * Receive the active windows to be able to send events to that windows
 */
ipcMain.on(ev.INIT_APP, (event) => {
  reactWindow = event.sender
})

/**
 * Exit app
 */
ipcMain.on(ev.EXIT_APP, () => {
  app.exit()
})

/**
 * Change the stats interval
 */
ipcMain.on(ev.INTERVAL_CHANGED, (event, interval) => {
  stats.setInterval(interval)
})

/**
 * Main app ask for Settings
 */
ipcMain.on(ev.GET_SETTINGS, () => {
  emitEvent(ev.GET_SETTINGS, store.store)
})

/**
 * Main app ask for Stats
 */
ipcMain.on(ev.GET_STATS, () => {
  emitEvent(ev.GET_STATS, stats.getPreviousStats())
})

/**
 * Settings changed!
 */
ipcMain.on(ev.SETTINGS_CHANGED, (event, settings) => {
  stats.setInterval(settings.interval)

  //save settings on store
  Object.keys(settings).map(key => {
    store.set(key, settings[key])
  })
})

/**
 * Receive the active windows to be able to send events to that windows
 */
ipcMain.on(ev.INIT_APP, (event) => {
  reactWindow = event.sender
})

//main
mb.on('ready', () => {
  console.log('app is ready')

  let imageManager = new ImageManager(setTrayImage)
  stats = new Stats(emitEvent, store.get('interval'))

  imageManager.preloadAll()
    .then(() => {
      //init stats
      stats.setImageManager(imageManager)
      stats.updateStats()
    })

})

mb.on('show', () => {
  if (isDev) {
    mb.window.openDevTools()
  }
})
