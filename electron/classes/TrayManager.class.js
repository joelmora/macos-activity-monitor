const { Tray, Menu } = require("electron");
const path = require("path");

const statTemplateDir = "../assets/icons/statTemplate.png";

class TrayManager {
  constructor(mainWindow, dock) {
    this.tray = null;
    this.mainWindow = mainWindow;
    this.dock = dock;
  }

  getWindowPosition = () => {
    const windowBounds = this.mainWindow.getBounds();
    const trayBounds = this.tray.getBounds();
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
    const y = Math.round(trayBounds.y + trayBounds.height);

    return { x, y };
  };

  showWindow = () => {
    const position = this.getWindowPosition();
    this.mainWindow.setPosition(position.x, position.y, false);
    this.mainWindow.show();
    this.mainWindow.setVisibleOnAllWorkspaces(true);
    this.mainWindow.focus();
    this.mainWindow.setVisibleOnAllWorkspaces(false);

    this.dock.hide();
  };

  rightClickMenu = () => {
    const menu = [
      {
        role: "quit",
        accelerator: "Command+Q",
      },
    ];
    
    this.tray.popUpContextMenu(Menu.buildFromTemplate(menu));
  };

  toggleWindow = () => {
    //FIXME doesn't work when you click outside the window
    //FIXME doesn't work on multiples desktops
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  };

  setImage = (path) => {
    this.tray.setImage(path);
  };

  createTray = () => {
    this.tray = new Tray(path.join(__dirname, statTemplateDir));
    this.tray.setIgnoreDoubleClickEvents(true);

    this.tray.on("click", this.toggleWindow);
    this.tray.on("right-click", this.rightClickMenu);
  };
}

module.exports = TrayManager;
