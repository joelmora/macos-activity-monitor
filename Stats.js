const util = require('util')
const exec = util.promisify(require('child_process').exec)

const cpuCommand = 'iostat -n0'
const memoryStatsCommand = 'vm_stat'
const memorySizeCommand = 'sysctl -n hw.memsize'
const unitDivisor = 1048576 //MB

class Stats {
  constructor(emitEvent, interval = 2000) {
    this.interval = interval
    this.emitEvent = emitEvent
  }
  setImageManager(imageManager) {
    this.imageManager = imageManager
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
    const { stdout, stderr } = await exec(cpuCommand)

    if (stderr) {
      return
    }

    let lines = stdout.split('\n')
    const regex = /\s+(\d+)\s+(\d+)\s+(\d+)/
    let [, CPUuser, CPUsystem, CPUidle] = lines[2].match(regex)
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
    const results = await this.getAll()

    this.emitEvent('stats-updated', results)

    //TODO available icons as parameter
    let iconOpts = [
      { attr: 'mem', value: results.memory.percentage.used, unit: 'percentage' },
      { attr: 'cpu', value: results.cpu.percentage.used, unit: 'percentage' },
    ]

    //draw the icon
    this.imageManager.drawIcon(iconOpts)

    //update stats again every "x" interval
    setTimeout(() => this.updateStats(), this.interval)
  }
}

module.exports = Stats