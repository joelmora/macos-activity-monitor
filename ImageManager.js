const Jimp = require('Jimp')
const util = require('util')
const { nativeImage } = require('electron')

class ImageManager {
  constructor(setTrayImage) {
    this.setTrayImage = setTrayImage

    this.allImages = [
      { type: 'blank', src: '/icons/blank.png' },
      { type: 'space', src: '/icons/space.png' },
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
    return this.allImages.find(img => img.type === type).jimp.clone()
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
   * Compact Version = title and % value vertically
   * @param {*} icons 
   */
  async getCompactVersionIcons(icons) {
    return await icons.map(async icon => {
      let numbers = icon.value.toString().split('')

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
      let unitImg

      switch (icon.unit) {
        case 'percentage':
          unitImg = this.getJimp('percentage')
          break
      }

      return await backWNumbers.composite(unitImg, x, y)
    })
  }
  /**
   * Creates an image part by part and draw it on the menubar
   * @param {*} icons 
   */
  async drawIcon(icons) {

    let iconImages = []
    iconImages = await this.getCompactVersionIcons(icons)

    //grab all icons (cpu, mem, etc) and merge into one image
    let totalWidth = iconImages.length * 26 + (iconImages.length - 1) * 5
    let finalIcon = await new Jimp(totalWidth, 22)
    let x = 0

    for (let i = 0; i < iconImages.length; i++) {
      let attrIcon = await iconImages[i]

      if (i > 0) {
        //add space between attributes
        finalIcon = await finalIcon.composite(this.getJimp('space'), x, 0)
        x += 5
      }

      finalIcon = await finalIcon.composite(attrIcon, x, 0)
      x += 26
    }

    const finalIconInverted = finalIcon.clone().invert()

    //get image buffer
    const imgBuffer = await finalIcon.getBufferAsync(Jimp.MIME_PNG)
    const imgBufferInverted = await finalIconInverted.getBufferAsync(Jimp.MIME_PNG)

    //transform buffers to nativeImage
    let electronImage = nativeImage.createFromBuffer(imgBuffer)
    let electronImageInverted = nativeImage.createFromBuffer(imgBufferInverted)

    //set icons on tray
    this.setTrayImage(electronImage, electronImageInverted)
  }
}


module.exports = ImageManager