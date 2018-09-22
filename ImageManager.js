const Jimp = require('Jimp')
const util = require('util')
const { nativeImage } = require('electron')

class ImageManager {
  constructor(setTrayImage) {
    this.setTrayImage = setTrayImage

    this.allImages = [
      { type: 'blank', src: '/icons/blank.png' },
      { type: 'mem', src: '/icons/mem.png' },
      { type: 'cpu', src: '/icons/cpu.png' },
      { type: 'percentage', src: '/icons/%.png' },
      { type: '1', src: '/icons/numbers/1.png' },
      { type: '2', src: '/icons/numbers/2.png' },
      { type: '3', src: '/icons/numbers/3.png' },
      { type: '4', src: '/icons/numbers/4.png' },
      { type: '5', src: '/icons/numbers/5.png' },
      { type: '6', src: '/icons/numbers/6.png' },
      { type: '7', src: '/icons/numbers/7.png' },
      { type: '8', src: '/icons/numbers/8.png' },
      { type: '9', src: '/icons/numbers/9.png' },
      { type: '0', src: '/icons/numbers/0.png' },
    ]
  }
  getJimp(type) {
    console.log('type', type)
    return this.allImages.find(img => img.type === type).jimp
  }
  findByType(type) {
    return this.allImages.find(img => img.type === type)
  }
  /**
   * Loads all images available and return it
   */
  async loadAll() {
    return this.getImages()
  }
  /**
   * Get all images recursively
   * @param {*} index 
   */
  async getImages(index = 0) {
    //base case, return all images
    if (index === this.allImages.length) {
      return this.allImages
    }

    //read the image from disk and get the jimp object
    const jimpImg = await Jimp.read(__dirname + this.allImages[index].src)

    //add jimp object to the array
    this.allImages[index].jimp = jimpImg

    //get the next image
    return this.getImages(index + 1)
  }
  /**
   * Creates an image part by part and draw it on the menubar
   * @param {*} icons 
   */
  async drawIcon(icons) {

    //TODO allow multiples icons
    await icons.map(async icon => {
      let numbers = icon.value.toString().split('')

      //compact version
      const blank = this.getJimp('blank')
      const title = this.getJimp(icon.attr)

      let x = 0
      let y = 0

      //backgroung with title
      const background = await blank.composite(title, x, y)

      //add each number
      x += 1
      y += 9

      let backWNumbers

      await numbers.map(async number => {
        const numberImg = this.getJimp(number)

        backWNumbers = background.composite(numberImg, x, y)
        x += 7
      })

      //add the unit (%, MB, etc)
      let finishedComposite
      let unitImg

      switch (icon.unit) {
        case 'percentage':
          unitImg = this.getJimp('percentage')
          break
      }

      finishedComposite = await backWNumbers.composite(unitImg, x, y)

      //get image buffer
      const imgBuffer = await util.promisify(finishedComposite.getBuffer.bind(finishedComposite))('image/png')

      //set icon on tray
      let electronImage = nativeImage.createFromBuffer(imgBuffer)
      //FIXME replace icon with a new image every time
      this.setTrayImage(electronImage)
    })

  }
}


module.exports = ImageManager