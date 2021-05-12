const Jimp = require("jimp");
const path = require("path");

const HEIGHT = 22;
const COMPACT_W = 26;
const SPACE_W = 5;

const imageDir = path.join(__dirname, "../assets/icons/");
const fontDir = path.join(__dirname, "../assets/fonts/");

class ImageManager {
  constructor(setTrayImage, getSetting, tempPath) {
    this.setTrayImage = setTrayImage;
    this.getSetting = getSetting;
    this.tempPath = tempPath;
    this.icons = [];

    this.allImages = [{ type: "stat", src: imageDir + "statTemplate.png" }];
  }

  /**
   * Get the jimp object from image
   */
  getJimp = (type) => this.allImages.find((img) => img.type === type).jimp.clone();

  findByType = (type) => this.allImages.find((img) => img.type === type);

  /**
   * Loads all images available and return it
   */
  preloadAll = async () => await this.getImages();

  /**
   * Get all images recursively
   */
  getImages = async (index = 0) => {
    //base case, return all images
    if (index === this.allImages.length) {
      return this.allImages;
    }

    //read the image from disk and get the jimp object
    const jimpImg = await Jimp.read(this.allImages[index].src);

    //add jimp object to the array
    this.allImages[index].jimp = jimpImg;

    //get the next image
    return this.getImages(index + 1);
  };

  /**
   * Compact Version = title and % value vertically
   */
  getCompactVersionIcons = async (icons, scale = 1) =>
    icons.map(async (icon) => {
      const widthScaled = COMPACT_W * scale;
      const heightScaled = HEIGHT * scale;
      const fontTitleSizeScaled = 8 * scale;
      const fontValueSizeScaled = 13 * scale;
      const jimpImg = await new Jimp(widthScaled, heightScaled);

      //bitmap fonts generated with https://github.com/libgdx/libgdx/wiki/Hiero
      const fontTitle = await Jimp.loadFont(fontDir + `helvetica_${fontTitleSizeScaled}_b.fnt`);
      const fontValue = await Jimp.loadFont(fontDir + `helvetica_${fontValueSizeScaled}.fnt`);

      const value = icon.value.toString();
      let unit;
      let title;

      //unit
      switch (icon.unit) {
        case "percentage":
          unit = "%";
          break;
      }

      //title
      switch (icon.indicator) {
        case "mem":
          title = "MEM";
          break;
        case "cpu":
          title = "CPU";
          break;
      }

      jimpImg.print(fontTitle, 0, 2, { text: title, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, widthScaled, heightScaled);
      jimpImg.print(
        fontValue,
        0,
        0,
        { text: value + unit, alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM },
        widthScaled,
        heightScaled
      );

      return jimpImg;
    });

  /**
   * Creates an image part by part and draw it on the menubar
   */
  drawIcons = async (iconsOptions) => {
    this.icons = iconsOptions;

    const icons = [];

    //show/hide icons depending on the settings
    this.getSetting("indicators").map((indicator) => {
      if (!indicator.showIcon) {
        return;
      }

      icons.push(iconsOptions.find((icon) => icon.indicator === indicator.short));
    });

    //user turned off all icons, should display default icon
    if (icons.length === 0) {
      this.setTrayImage(imageDir + "statTemplate.png");
      return;
    }

    const iconImages = await this.getCompactVersionIcons(icons);
    const iconImages2x = await this.getCompactVersionIcons(icons, 2);
    const iconImages3x = await this.getCompactVersionIcons(icons, 3);

    await this.writePngimage(iconImages);
    await this.writePngimage(iconImages2x, 2);
    await this.writePngimage(iconImages3x, 3);

    //set icons on tray
    this.setTrayImage(path.join(this.tempPath, "iconTemplate.png"));
  };

  writePngimage = async (iconImages, scale = 1) => {
    const widthScaled = COMPACT_W * scale;
    const heightScaled = HEIGHT * scale;
    const spaceScaled = SPACE_W * scale;

    //grab all icons (cpu, mem, etc) and merge into one image
    const totalWidth = iconImages.length * widthScaled + (iconImages.length - 1) * spaceScaled;
    let finalIcon = await new Jimp(totalWidth, heightScaled);
    let x = 0;

    for (let i = 0; i < iconImages.length; i++) {
      let attrIcon = await iconImages[i];

      //add space between attributes
      if (i > 0) {
        x += spaceScaled;
      }

      finalIcon = await finalIcon.composite(attrIcon, x, 0);

      x += widthScaled;
    }

    const suffix = scale === 1 ? "" : `@${scale}x`;

    await finalIcon.writeAsync(path.join(this.tempPath, `iconTemplate${suffix}.png`));
  };

  /**
   * Redraw icons
   */
  redrawIcons = async () => await this.drawIcons(this.icons);
}

module.exports = ImageManager;
