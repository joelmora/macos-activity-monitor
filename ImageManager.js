const Jimp = require('Jimp')
const { nativeImage } = require('electron')

const HEIGHT = 22
const COMPACT_W = 26
const SPACE_W = 5

class ImageManager {
  constructor(setTrayImage) {
    this.setTrayImage = setTrayImage

    this.allImages = [
      //TODO preloads png images
      // { type: 'blank', src: '/icons/blank.png' },
    ]
  }
  /**
   * Get the jimp object from image
   * @param {*} type 
   */
  getJimp(type) {
    return this.allImages.find(img => img.type === type).jimp.clone()
  }
  findByType(type) {
    return this.allImages.find(img => img.type === type)
  }
  /**
   * Loads all images available and return it
   */
  async preloadAll() {
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
      let jimpImg = await new Jimp(COMPACT_W, HEIGHT)

      //bitmap fonts generated with https://github.com/libgdx/libgdx/wiki/Hiero
      const fontTitle = await Jimp.loadFont(__dirname + '/fonts/helvetica_8_b.fnt')
      const fontValue = await Jimp.loadFont(__dirname + '/fonts/helvetica_13.fnt')

      let value = icon.value.toString()
      let unit
      let title

      //unit
      switch (icon.unit) {
        case 'percentage':
          unit = '%'
          break
      }

      //title
      switch (icon.attr) {
        case 'mem':
          title = 'MEM'
          break
        case 'cpu':
          title = 'CPU'
          break
      }

      jimpImg.print(fontTitle, 0, 2, { text: title, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, COMPACT_W, HEIGHT)
      jimpImg.print(fontValue, 0, 0, { text: value + unit, alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM }, COMPACT_W, HEIGHT)

      return jimpImg
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
    let totalWidth = iconImages.length * COMPACT_W + (iconImages.length - 1) * SPACE_W
    let finalIcon = await new Jimp(totalWidth, HEIGHT)
    let x = 0

    for (let i = 0; i < iconImages.length; i++) {
      let attrIcon = await iconImages[i]

      //add space between attributes
      if (i > 0) {
        x += SPACE_W
      }

      finalIcon = await finalIcon.composite(attrIcon, x, 0)
      x += COMPACT_W
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