const { ipcMain } = require("electron");

const ev = require("../utils/events");

class EventManager {
  constructor(stats, imageManager, store, setLaunchAtLoginFunc, exitAppFunc) {
    this.stats = stats;
    this.imageManager = imageManager;
    this.store = store;
    this.setLaunchAtLoginFunc = setLaunchAtLoginFunc;
    this.exitAppFunc = exitAppFunc;
  }

  /**
   * Send event to other processes
   */
  emitEvent = (event, data) => {
    if (this.reactWindow) {
      this.reactWindow.send(event, data);
    } else {
      setTimeout(() => {
        this.emitEvent(event, data);
      }, 100);
    }
  };

  listen = () => {
    /**
     * Receive the active windows to be able to send events to that windows
     */
    ipcMain.on(ev.INIT_APP, (event) => {
      this.reactWindow = event.sender;
    });

    /**
     * Exit app
     */
    ipcMain.on(ev.EXIT_APP, () => {
      this.exitAppFunc();
    });

    /**
     * Change the stats interval
     */
    ipcMain.on(ev.INTERVAL_CHANGED, (event, interval) => {
      this.stats.setInterval(interval);
    });

    /**
     * Main app ask for Settings
     */
    ipcMain.on(ev.GET_SETTINGS, () => {
      this.emitEvent(ev.GET_SETTINGS, this.store.store);
    });

    /**
     * Main app ask for Stats
     */
    ipcMain.on(ev.GET_STATS, () => {
      if (this.stats) {
        this.emitEvent(ev.GET_STATS, this.stats.getPreviousStats());
      }
    });

    /**
     * Settings changed!
     */
    ipcMain.on(ev.SETTINGS_CHANGED, (event, settings) => {
      this.stats.setInterval(settings.interval);

      //save settings on store
      Object.keys(settings).map((key) => {
        if (key === "launchOnLogin") {
          this.setLaunchAtLoginFunc(settings[key]);
        }

        this.store.set(key, settings[key]);
      });
    });

    /**
     * Redraw icons on tray
     */
    ipcMain.on(ev.REDRAW_ICONS, () => {
      this.imageManager.redrawIcons();
    });
  };
}

module.exports = EventManager;
