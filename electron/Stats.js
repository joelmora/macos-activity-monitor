const util = require('util')
const exec = util.promisify(require('child_process').exec)
const ev = require('../src/utils/events')

const cpuUsageCommand = 'top -l 1 -stats "pid,command,cpu" -n 0 |grep CPU'
const memoryStatsCommand = 'vm_stat'
const memorySizeCommand = 'sysctl -n hw.memsize'
const unitDivisor = 1048576 //MB
const MAX_RESULT_CACHE = 100

class Stats {
  /**
   * 
   * @param {*} emitEvent Emit event to main process
   * @param {*} interval every x miliseconds to update stats
   */
  constructor(emitEvent, interval = 5000) {
    this.results = []
    this.interval = interval
    this.emitEvent = emitEvent
  }
  setImageManager(imageManager) {
    this.imageManager = imageManager
  }
  setInterval(interval) {
    this.interval = interval
  }
  saveResults(result) {
    this.results.push(result)
    this.results = this.results.slice(-MAX_RESULT_CACHE)
  }
  getPreviousStats() {
    return this.results
  }
  /**
   * Get all stats available
   */
  async getAll() {
    let cpuStats = await this.getCPUStats()
    let memoryStats = await this.getMemoryStats()

    return {
      memory: memoryStats,
      cpu: cpuStats,
    }
  }
  /**
   * Get memory stats
   */
  async getMemoryStats() {
    //Total memory available
    const memorySizeResult = await exec(memorySizeCommand)

    if (memorySizeResult.stderr) {
      return
    }

    const totalMemory = parseInt(memorySizeResult.stdout / unitDivisor)

    //Memory stats
    const memoryStatsResult = await exec(memoryStatsCommand)

    if (memoryStatsResult.stderr) {
      return
    }

    let lines = memoryStatsResult.stdout.split('\n')

    let pageFree = parseInt(lines[1].match(/\d+/)[0]) * 4096 / unitDivisor
    let pageInactive = parseInt(lines[3].match(/\d+/)[0]) * 4096 / unitDivisor
    let pageWired = parseInt(lines[6].match(/\d+/)[0]) * 4096 / unitDivisor
    let pagePurgeable = parseInt(lines[7].match(/\d+/)[0]) * 4096 / unitDivisor
    let pageAnonymous = parseInt(lines[14].match(/\d+/)[0]) * 4096 / unitDivisor
    let pageCompressed = parseInt(lines[16].match(/\d+/)[0]) * 4096 / unitDivisor

    let appMemory = pageAnonymous + pagePurgeable
    let memoryUsed = appMemory + pageWired + pageCompressed

    let percentageUsed = parseInt((memoryUsed / totalMemory) * 100)
    let memoryFree = pageFree + pageInactive

    return {
      percentage: {
        used: percentageUsed,
      },
      free: memoryFree,
      used: memoryUsed,
    }
  }
  /**
   * Get CPU stats
   */
  async getCPUStats() {
    const { stdout, stderr } = await exec(cpuUsageCommand)

    if (stderr) {
      return
    }

    const regex = /(\d+.\d+%)/g
    let [CPUuser, CPUsystem, CPUidle] = stdout.match(regex)
    let CPUusedPercentage = parseInt(CPUuser) + parseInt(CPUsystem)

    return {
      percentage: {
        used: CPUusedPercentage,
        user: parseInt(CPUuser),
        system: parseInt(CPUsystem),
        idle: parseInt(CPUidle),
      }
    }
  }
  /**
   * Get stats and update the UI
   */
  async updateStats() {
    const result = await this.getAll()

    this.saveResults(result)

    this.emitEvent(ev.STATS_UPDATED, {
      results: this.results,
      interval: this.interval,
    })

    //TODO available icons as parameter
    let iconOpts = [
      { attr: 'mem', value: result.memory.percentage.used, unit: 'percentage' },
      { attr: 'cpu', value: result.cpu.percentage.used, unit: 'percentage' },
    ]

    //draw the icon
    this.imageManager.drawIcon(iconOpts)

    //update stats again every "x" interval
    setTimeout(() => this.updateStats(), this.interval)
  }
}

module.exports = Stats