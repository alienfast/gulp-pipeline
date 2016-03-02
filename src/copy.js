import BaseRecipe from './baseRecipe'
import File from './util/file'
import extend from 'extend'
import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'


const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'copy'
  },
  process: (content, srcpath) => {  // eslint-disable-line no-unused-vars
  }, // allows modification of the file content before writing to destination
  encoding: 'utf8',
  mode: false, // true will copy the existing file/directory permissions, otherwise set the mode e.g. 0644
  timestamp: false, // Preserve the timestamp attributes(atime and mtime) when copying files. Timestamp will not be preserved when the file contents or name are changed during copying.

  preserveBOM: false // Whether to preserve the BOM on this.read rather than strip it.
}

/**
 *  Copy files to a destination with permissions and processing options.
 *
 *  TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
 *
 *  @credit to grunt and grunt-contrib-copy for the implementation. See license for attribution.
 */
const Copy = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))

  }

  createHelpText() {
    return `Copies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
  }

  run() {
    let copyOptions = {
      encoding: this.config.encoding,
      process: this.config.process,
      noProcess: this.config.noProcess
    }


    let isExpandedPair
    let dirs = {}
    let tally = {
      dirs: 0,
      files: 0
    }


    // TODO: convert this to use glob

    this.files.forEach((filePair) => {
      isExpandedPair = filePair.orig.expand || false

      filePair.src.forEach((src) => {
        let dest = filePair.dest

        if (File.detectDestType(dest) === 'directory') {
          dest = isExpandedPair ? dest : path.join(dest, src)
        }

        if (File.isDir(src)) {
          this.debug(`Creating ${chalk.cyan(dest)}`)
          File.mkdir(dest)
          if (this.config.mode !== false) {
            fs.chmodSync(dest, (this.config.mode === true) ? fs.lstatSync(src).mode : this.config.mode)
          }

          if (this.config.timestamp) {
            dirs[dest] = src
          }

          tally.dirs++
        } else {
          this.debug(`Copying ${chalk.cyan(src)} -> ${chalk.cyan(dest)}`)
          File.copy(src, dest, copyOptions)
          File.syncTimestamp(src, dest)
          if (this.config.mode !== false) {
            fs.chmodSync(dest, (this.config.mode === true) ? fs.lstatSync(src).mode : this.config.mode)
          }
          tally.files++
        }
      })
    })

    if (this.config.timestamp) {
      Object.keys(dirs).sort(function (a, b) {
        return b.length - a.length
      }).forEach(function (dest) {
        File.syncTimestamp(dirs[dest], dest)
      })
    }

    if (tally.dirs) {
      this.log(`Created ${chalk.cyan(tally.dirs.toString()) + (tally.dirs === 1 ? ' directory' : ' directories')}`)
    }

    if (tally.files) {
      this.log((tally.dirs ? ', copied ' : 'Copied ') + chalk.cyan(tally.files.toString()) + (tally.files === 1 ? ' file' : ' files'))
    }
  }
}

export default Copy
