const Store = require("electron-store");
const Path = require("path");
const { is } = require("electron-util");
const { ipcMain, app, BrowserWindow } = require("electron");

const Stats = require("./electron/Stats");
const ImageManager = require("./electron/ImageManager");
const TrayManager = require("./electron/TrayManager");
const ev = require("./src/utils/events");

const isDev = is.development;

let reactWindow;
let stats;
let imageManager;
let mainWindow;
let tray;

const store = new Store({
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

//listeners
/**
 * Receive the active windows to be able to send events to that windows
 */
ipcMain.on(ev.INIT_APP, (event) => {
  reactWindow = event.sender;
});

/**
 * Exit app
 */
ipcMain.on(ev.EXIT_APP, () => {
  app.exit();
});

/**
 * Change the stats interval
 */
ipcMain.on(ev.INTERVAL_CHANGED, (event, interval) => {
  stats.setInterval(interval);
});

/**
 * Main app ask for Settings
 */
ipcMain.on(ev.GET_SETTINGS, () => {
  emitEvent(ev.GET_SETTINGS, store.store);
});

/**
 * Main app ask for Stats
 */
ipcMain.on(ev.GET_STATS, () => {
  emitEvent(ev.GET_STATS, stats.getPreviousStats());
});

/**
 * Settings changed!
 */
ipcMain.on(ev.SETTINGS_CHANGED, (event, settings) => {
  stats.setInterval(settings.interval);

  //save settings on store
  Object.keys(settings).map((key) => {
    if (key === "launchOnLogin") {
      enableDisableAutoStartup(settings[key]);
    }

    store.set(key, settings[key]);
  });
});

/**
 * Redraw icons on tray
 */
ipcMain.on(ev.REDRAW_ICONS, () => {
  imageManager.redrawIcons();
});

/**
 * Sets icons on the tray
 * @param {*} path
 */
const setTrayImage = (path) => {
  if (tray) {
    tray.setImage(path);
  }
};

/**
 * Send event to other processes
 */
const emitEvent = (event, data) => {
  if (reactWindow) {
    reactWindow.send(event, data);
  } else {
    setTimeout(() => {
      emitEvent(event, data);
    }, 100);
  }
};

/**
 * Get a key on the store
 */
const getStoreKey = (key) => {
  return store.get(key);
};

/**
 * Enable or Disable the auto start
 * @param {*} launchOnLogin
 */
const enableDisableAutoStartup = (launchOnLogin) => {
  if (isDev) {
    return;
  }

  app.setLoginItemSettings({
    openAtLogin: launchOnLogin,
  });
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: "#FFF",
    width: 500,
    height: 500,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      devTools: isDev,
      nodeIntegration: true,
    },
  });

  if (isDev) {
    // mainWindow.webContents.openDevTools({ mode: "detach" });
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadURL(Path.join("file://", __dirname, "build/index.html"));
  }
};

// Wait until the app is ready
app.once("ready", () => {
  createMainWindow();

  tray = new TrayManager(mainWindow, app.dock);
  tray.createTray();

  imageManager = new ImageManager(setTrayImage, getStoreKey);
  stats = new Stats(emitEvent, getStoreKey);

  imageManager.preloadAll().then(() => {
    //init stats
    stats.setImageManager(imageManager);
    stats.updateStats();
  });

  app.dock.hide();

  app.setLoginItemSettings({
    openAtLogin: getStoreKey("launchOnLogin"),
  });
});
