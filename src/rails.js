import path from 'path'
//import extend from 'extend'
import glob from 'glob'
import spawn from 'cross-spawn'
import fs from 'fs'
import jsonfile from 'jsonfile'
import Util from 'gulp-util'
import stringify from 'stringify-object'

const BaseDirectoriesCache = `.gulp-pipeline-rails.json`
const GemfileLock = `Gemfile.lock`

const Rails = class {
  static enumerateEngines() {

    let results = spawn.sync(this.localPath('railsRunner.sh'), [this.localPath('enumerateEngines.rb')], {
      sdtio: 'inherit',
      cwd: this.railsAppCwd()
    })

    //Util.log(stringify(results))
    if (results.stderr != '' || results.error != '') {
      Util.log(stringify(results))

      let msg = ''
      if (results.stderr) {
        msg += results.stderr
      }
      if (results.error) {
        msg += results.error
      }
      // message will be either error or stderr, so just grap both of them
      throw new Error(`Ruby script error: \n${results.stderr}${results.error}`)
    }
    return JSON.parse(results.stdout)
  }

  /**
   * We need a rails app to run our rails script runner.  Since this project could be a rails engine, find a rails app somewhere in or under the cwd.
   */
  static railsAppCwd() {
    let entries = glob.sync('**/bin/rails', {realpath: true})
    if (!entries || entries.length <= 0) {
      throw new Error(`Unable to find Rails application directory based on existence of 'bin/rails'`)
    }

    if (entries.length > 1) {
      throw new Error(`railsAppCwd() should only find one rails application but found ${entries}`)
    }
    return path.join(entries[0], '../..')
  }

  static localPath(name) {
    let filename = `rails/${name}`

    // if using source dir
    let filepath = filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    try {
      fs.statSync(filepath)
    }
    catch (error) {
      // if using dist dir
      filepath = path.join(__dirname, '../src', filename) // eslint-disable-line no-undef
      fs.statSync(filepath)
    }

    return filepath
  }

  /**
   * Return the baseDirectories to search for assets such as images.  In rails, this means
   *  enumerating rails engines and collecting their root paths.  This is a lengthy process
   *  because you have to startup a rails environment to enumerate the engines, so we cache
   *  the baseDirectories in a file and compare it to the Gemfile.lock's modified time.  If
   *  the Gemfile.lock changes, we throw out the cache, enumerate the engines again and write
   *  a new cache file.
   *
   * @returns {{baseDirectories: string[]}}
   */
  static baseDirectories() {
    if (!this.changed(GemfileLock, BaseDirectoriesCache)) {
      return jsonfile.readFileSync(BaseDirectoriesCache)
    }
    else {
      Util.log(`Generating baseDirectories cache...`)
      try {
        fs.unlinkSync(BaseDirectoriesCache)
      } catch (error) {
        //ignore
      }

      Util.log(`Enumerating rails engines...`)
      let engines = Rails.enumerateEngines()
      //console.log(stringify(engines))

      let baseDirectories = ['./']
      for (let key of Object.keys(engines)) {
        baseDirectories.push(engines[key])
      }

      Util.log(`Writing baseDirectories cache...`)
      let result = {baseDirectories: baseDirectories}
      jsonfile.writeFileSync(BaseDirectoriesCache, result, {spaces: 2})
      return result
    }
  }

  static changed(sourceFileName, targetFileName) {
    let sourceStat = null
    let targetStat = null
    try {
      sourceStat = fs.statSync(sourceFileName)
      targetStat = fs.statSync(targetFileName)
    }
    catch (error) {
      return true
    }

    if (sourceStat.mtime > targetStat.mtime) {
      return true
    }
    else {
      return false
    }
  }
}

export default Rails
