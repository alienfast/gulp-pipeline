import BaseRecipe from './baseRecipe'
//import File from './util/file'
import extend from 'extend'
//import fs from 'fs-extra'
import path from 'path'
//import chalk from 'chalk'
import process from 'process'
import glob from 'glob'


const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'copy'
  },
  process: (content, srcpath) => {  // eslint-disable-line no-unused-vars
  }, // allows modification of the file content before writing to destination
  //encoding: 'utf8',
  //mode: false,            // True will copy the existing file/directory permissions, otherwise set the mode e.g. 0644
  //timestamp: false,       // Preserve the timestamp attributes(atime and mtime) when copying files. Timestamp will not be preserved
  //                        //    when the file contents or name are changed during copying.
  //preserveBOM: false,     // Whether to preserve the BOM on this.read rather than strip it.

  source: {
    glob: undefined,      // [] or string glob pattern https://github.com/isaacs/node-glob#glob-primer
    options: {            // https://github.com/isaacs/node-glob#options
      cwd: process.cwd()  // base path
    }
  },
  dest: undefined         // base path
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
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))

    this.requireValue(this.config.source.glob, `source.glob`)
    this.requireValue(this.config.source.options.cwd, `source.options.cwd`)
    this.requireValue(this.config.dest, `dest`)

    // ensure array
    if (!Array.isArray(this.config.source.glob)) {
      this.config.source.glob = [this.config.source.glob]
    }
  }

  createHelpText() {
    return `Copies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
  }

  run() {

    let options = extend(true, {}, this.config.source.options, {realpath: true})
    for (let pattern of this.config.source.glob) {

      this.log(`Copying ${options.cwd}/${pattern}...`)
      for (let fromFullPath of glob.sync(pattern, options)) {
        let from = path.relative(process.cwd(), fromFullPath)
        let to = path.join(this.config.dest, from)
        this.log(`\t...to ${to}`)
        //fs.copySync(from, to)
      }
    }


    /*
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
     */
  }
}

export default Copy
