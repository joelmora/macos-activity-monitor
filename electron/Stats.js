const util = require("util");
const exec = util.promisify(require("child_process").exec);
const ev = require("../src/utils/events");

const cpuUsageCommand = 'top -l 1 -stats "pid,command,cpu" -n 0 |grep CPU';
const memoryStatsCommand = "vm_stat";
const memorySizeCommand = "sysctl -n hw.memsize";
const unitDivisor = 1048576; //MB
const MAX_RESULT_CACHE = 100;

class Stats {
  /**
   * @param {*} emitEvent Emit event to main process
   * @param {*} getSetting Get a setting
   */
  constructor(emitEvent, getSetting) {
    this.results = [];
    this.getSetting = getSetting;
    this.interval = getSetting("interval");
    this.emitEvent = emitEvent;
  }

  setImageManager = (imageManager) => {
    this.imageManager = imageManager;
  };

  setInterval = (interval) => {
    this.interval = interval;
  };

  saveResults = (result) => {
    this.results.push(result);
    this.results = this.results.slice(-MAX_RESULT_CACHE);
  };

  getPreviousStats = () => this.results;

  /**
   * Get all stats available
   */
  getAll = async () => {
    const cpuStats = await this.getCPUStats();
    const memoryStats = await this.getMemoryStats();

    return {
      memory: memoryStats,
      cpu: cpuStats,
    };
  };

  /**
   * Get memory stats
   */
  getMemoryStats = async () => {
    //Total memory available
    const memorySizeResult = await exec(memorySizeCommand);

    if (memorySizeResult.stderr) {
      return;
    }

    const totalMemory = parseInt(memorySizeResult.stdout / unitDivisor);

    //Memory stats
    const memoryStatsResult = await exec(memoryStatsCommand);

    if (memoryStatsResult.stderr) {
      return;
    }

    const lines = memoryStatsResult.stdout.split("\n");

    const pageFree = (parseInt(lines[1].match(/\d+/)[0]) * 4096) / unitDivisor;
    const pageInactive = (parseInt(lines[3].match(/\d+/)[0]) * 4096) / unitDivisor;
    const pageWired = (parseInt(lines[6].match(/\d+/)[0]) * 4096) / unitDivisor;
    const pagePurgeable = (parseInt(lines[7].match(/\d+/)[0]) * 4096) / unitDivisor;
    const pageAnonymous = (parseInt(lines[14].match(/\d+/)[0]) * 4096) / unitDivisor;
    const pageCompressed = (parseInt(lines[16].match(/\d+/)[0]) * 4096) / unitDivisor;

    const appMemory = pageAnonymous + pagePurgeable;
    const memoryUsed = appMemory + pageWired + pageCompressed;

    const percentageUsed = parseInt((memoryUsed / totalMemory) * 100);
    const memoryFree = pageFree + pageInactive;

    return {
      percentage: {
        used: percentageUsed,
      },
      free: memoryFree,
      used: memoryUsed,
    };
  };

  /**
   * Get CPU stats
   */
  getCPUStats = async () => {
    const { stdout, stderr } = await exec(cpuUsageCommand);

    if (stderr) {
      return;
    }

    const regex = /(\d+.\d+%)/g;
    const [CPUuser, CPUsystem, CPUidle] = stdout.match(regex);
    const CPUusedPercentage = parseInt(CPUuser) + parseInt(CPUsystem);

    return {
      percentage: {
        used: CPUusedPercentage,
        user: parseInt(CPUuser),
        system: parseInt(CPUsystem),
        idle: parseInt(CPUidle),
      },
    };
  };

  /**
   * Get stats and update the UI
   */
  updateStats = async () => {
    const result = await this.getAll();

    this.saveResults(result);

    this.emitEvent(ev.STATS_UPDATED, {
      results: this.results,
      interval: this.interval,
    });

    const iconOpts = [
      { indicator: "mem", value: result.memory.percentage.used, unit: "percentage" },
      { indicator: "cpu", value: result.cpu.percentage.used, unit: "percentage" },
    ];

    //draw the icon
    this.imageManager.drawIcons(iconOpts);

    //update stats again every "x" interval
    setTimeout(() => this.updateStats(), this.interval);
  };
}

module.exports = Stats;
