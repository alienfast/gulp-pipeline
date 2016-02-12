import path from 'path'
import spawn from 'cross-spawn'
import fs from 'fs'
import jsonfile from 'jsonfile'
import Util from 'gulp-util'

//import stringify from 'stringify-object'

const BaseDirectoriesCache = `.gulp-pipeline-rails.json`
const GemfileLock = `Gemfile.lock`

const Rails = class {
  static enumerateEngines() {
    let results = spawn.sync(this.filePath('railsRunner.sh'), [this.filePath('enumerateEngines.rb')], {sdtio: 'inherit'})
    return JSON.parse(results.output[1])
  }

  static filePath(name) {
    return path.join(__dirname, `rails/${name}`) // eslint-disable-line no-undef
  }

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

      let engines = Rails.enumerateEngines()
      //console.log(stringify(engines))

      let baseDirectories = ['./']
      for (let key of Object.keys(engines)) {
        baseDirectories.push(engines[key])
      }
      //console.log(stringify(baseDirectories))
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
