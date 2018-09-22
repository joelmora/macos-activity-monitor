const menubar = require('menubar')
const Stats = require('./Stats')
const ImageManager = require('./ImageManager')

const mb = menubar({
  icon: __dirname + '/icons/liontar.png'
})

const setTrayImage = (img) => {
  mb.tray.setImage(img)
}

//main
mb.on('ready', () => {
  console.log('app is ready')

  let imageManager = new ImageManager(setTrayImage)
  let stats = new Stats()

  let images

  imageManager.loadAll()
    .then(imgs => {
      images = imgs

      stats.setImageManager(imageManager)
      stats.updateStats()

      // console.log('images', images)
      // console.log('ocho', images.find(img => img.type === '8'))
    })


  // stats.updateStats()
  // stats.getAll()
  //   .then(stats => {
  //     console.log('stats', stats)
  //   })




})