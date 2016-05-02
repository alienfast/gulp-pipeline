import BaseRecipe from './baseRecipe'
import File from './util/file'
import extend from 'extend'
import path from 'path'
import chalk from 'chalk'
import process from 'process'
import globAll from 'glob-all'
import fs from 'fs-extra'

const Default = {
  debug: false,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'copy'
  },
  process: (content, srcpath) => {  // eslint-disable-line no-unused-vars
    return content
  }, // allows modification of the file content before writing to destination
  encoding: 'utf8',
  mode: false,            // True will copy the existing file/directory permissions, otherwise set the mode e.g. 0644
  timestamp: false,       // Preserve the timestamp attributes(atime and mtime) when copying files. Timestamp will not be preserved
  //                        //    when the file contents or name are changed during copying.
  //preserveBOM: false,     // Whether to preserve the BOM on this.read rather than strip it.

  source: {
    glob: undefined,      // [] or string glob pattern, uses node-glob-all https://github.com/jpillora/node-glob-all#usage
    options: {            // https://github.com/isaacs/node-glob#options
      cwd: process.cwd()  // base path
    }
  },
  dest: undefined,         // base path
  options: {}
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
    super(gulp, preset, Default, ...configs)

    this.requireValue(this.config.source.glob, `source.glob`)
    this.requireValue(this.config.source.options.cwd, `source.options.cwd`)
    this.requireValue(this.config.dest, `dest`)

    // ensure array
    if (!Array.isArray(this.config.source.glob)) {
      this.config.source.glob = [this.config.source.glob]
    }
  }

  createDescription() {
    return `Copies ${this.config.source.options.cwd}/${this.config.source.glob} to ${this.config.dest}`
  }

  chmod(from, to) {
    if (this.config.mode !== false) {
      fs.chmodSync(to, (this.config.mode === true) ? fs.lstatSync(from).mode : this.config.mode)
    }
  }

  run(done) {
    try {
      let dirs = {}
      let tally = {
        dirs: 0,
        files: 0
      }
      let copyOptions = {
        encoding: this.config.encoding,
        process: this.config.process
      }

      let options = extend(true, {}, this.config.source.options, {realpath: true})
      let pattern = this.config.source.glob

      // ensure pattern is an array
      if (!Array.isArray(pattern)) {
        pattern = [pattern]
      }

      // make a copy so that nothing processing will alter the config values
      pattern = pattern.slice()

      this.log(`Copying ${options.cwd}/${pattern}...`)
      //this.debugDump(`this config: `, this.config)

      for (let fromFullPath of globAll.sync(pattern, options)) {
        let from = path.relative(process.cwd(), fromFullPath)
        let toRelative = path.relative(options.cwd, from) // grab the path of the file relative to the cwd of the source cwd - allows nesting
        let to = path.join(this.config.dest, toRelative)

        if (File.isDir(from)) {
          this.log(`\t${chalk.cyan(to)}`)
          File.mkdir(to)
          this.chmod(from, to)
          dirs[from] = to
          tally.dirs++
        }
        else {
          this.log(`\t-> ${chalk.cyan(to)}`)
          File.copy(from, to, copyOptions)
          if (this.config.timestamp) {
            File.syncTimestamp(from, to)
          }
          this.chmod(from, to)
          tally.files++
        }
      }

      if (this.config.timestamp) {
        for (let from of Object.keys(dirs)) {
          File.syncTimestamp(from, dirs[from])
        }
      }

      let msg = ''
      if (tally.dirs) {
        msg += `Created ${chalk.cyan(tally.dirs.toString()) + (tally.dirs === 1 ? ' directory' : ' directories')}`
      }

      if (tally.files) {
        msg += (tally.dirs ? ', copied ' : 'Copied ') + chalk.cyan(tally.files.toString()) + (tally.files === 1 ? ' file' : ' files')
      }

      this.log(msg)
      this.donezo(done)
    }
    catch (error) {
      this.notifyError(error, done)
    }
  }
}

export default Copy
