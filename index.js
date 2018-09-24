const menubar = require('menubar')
const Stats = require('./Stats')
const ImageManager = require('./ImageManager')

const mb = menubar({
  icon: __dirname + '/icons/blank.png'
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

//main
mb.on('ready', () => {
  console.log('app is ready')

  let imageManager = new ImageManager(setTrayImage)
  let stats = new Stats()

  imageManager.loadAll()
    .then(() => {
      stats.setImageManager(imageManager)
      stats.updateStats()
    })

})