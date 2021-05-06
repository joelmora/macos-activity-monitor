const Store = require("electron-store");
const path = require("path");
const { is } = require("electron-util");
const { app, BrowserWindow } = require("electron");

const Stats = require("./Stats.class");
const ImageManager = require("./ImageManager.class");
const TrayManager = require("./TrayManager.class");
const EventManager = require("./EventManager.class");

const isDev = is.development;
const REACT_BUILD_DIR = path.join("file://", __dirname, "../react/build/index.html");

class Main {
  constructor() {
    this.tray = null;
    this.store = null;
    this.mainWindow = null;

    this.createStore();
  }

  createStore = () => {
    this.store = new Store({
      name: "user-preferences",
      defaults: {
        interval: 2000,
        indicators: [
          { name: "CPU", short: "cpu", showGraph: true, showIcon: true, color: "#0693E3", showColorPicker: false },
          { name: "Memory", short: "mem", showGraph: true, showIcon: true, color: "#00D084", showColorPicker: false },
        ],
        launchOnLogin: true,
      },
    });
  };

  /**
   * Sets icon value on the tray
   */
  setTrayImage = (path) => {
    if (this.tray) {
      this.tray.setImage(path);
    }
  };

  /**
   * Get a key from the store
   */
  getStoreKey = (key) => {
    return this.store.get(key);
  };

  /**
   * Set a key to the store
   */
  setStoreKey = (key, value) => {
    this.store.set(key, value);
  };

  createMainWindow = () => {
    this.mainWindow = new BrowserWindow({
      backgroundColor: "#FFF",
      width: 500,
      height: 500,
      show: false,
      frame: false,
      fullscreenable: false,
      resizable: false,
      webPreferences: {
        // devTools: isDev,
        devTools: true,
        nodeIntegration: true,
      },
    });

    if (isDev) {
      this.mainWindow.webContents.openDevTools({ mode: "detach" });
      this.mainWindow.loadURL("http://localhost:3000");
    } else {
      this.mainWindow.loadURL(REACT_BUILD_DIR);
    }
  };

  emitEvent = (event, data) => {
    this.eventManager.emitEvent(event, data);
  };

  init = () => {
    // Wait until the app is ready
    app.once("ready", async () => {
      this.createMainWindow();
      app.dock.hide();

      this.tray = new TrayManager(this.mainWindow, app.dock);
      this.tray.createTray();

      const imageManager = new ImageManager(this.setTrayImage, this.getStoreKey, app.getPath("temp"));
      const stats = new Stats(this.emitEvent, this.getStoreKey);

      this.eventManager = new EventManager(stats, imageManager, this.store);
      this.eventManager.listen();

      await imageManager.preloadAll();

      //init stats
      stats.setImageManager(imageManager);
      stats.updateStats();

      app.setLoginItemSettings({
        openAtLogin: this.getStoreKey("launchOnLogin"),
      });
    });
  };
}

module.exports = Main;
