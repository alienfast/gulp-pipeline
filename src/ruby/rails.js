import Ruby from './ruby'
import path from 'path'
import glob from 'glob'
import jsonfile from 'jsonfile'
import console from 'console'
import File from '../util/file'
import Base from '../base'

const Files = {
  CACHE: `.gulp-pipeline-rails.json`,
  GEM_LOCK: `Gemfile.lock`
}
const Rails = class extends Base {
  constructor(config = {debug: false}) {
    // We need a rails app to run our rails script runner.
    //  Since this project could be a rails engine, find a rails app somewhere in or under the cwd.
    let entries = glob.sync('**/bin/rails', {realpath: true})
    if (!entries || entries.length <= 0) {
      throw new Error(`Unable to find Rails application directory based on existence of 'bin/rails'`)
    }

    if (entries.length > 1) {
      throw new Error(`railsAppCwd() should only find one rails application but found ${entries}`)
    }
    let cwd = path.join(entries[0], '../..')

    super({cwd: cwd}, config)
  }

  enumerateEngines() {
    let results = this.exec(`${Ruby.localPath('railsRunner.sh')} ${Ruby.localPath('enumerateEngines.rb')}`)

    // run via spring with zero results:
    //    status: 0,
    //    stdout: '{}\n',
    //    stderr: 'Running via Spring preloader in process 95498\n',
    return JSON.parse(results.stdout)
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
  baseDirectories() {
    if (!File.modified(Files.GEM_LOCK, Files.CACHE)) {
      this.log(`Gemfile.lock is unchanged, using baseDirectories cache.`)
      return jsonfile.readFileSync(Files.CACHE)
    }
    else {
      this.log(`Generating baseDirectories and rails engines cache...`)
      File.delete(Files.CACHE, true)

      let engines = this.enumerateEngines()
      console.log(this.dump(engines)) // eslint-disable-line no-console

      let baseDirectories = ['./']
      for (let key of Object.keys(engines)) {
        baseDirectories.push(engines[key])
      }

      this.log(`Writing baseDirectories cache...`)
      let result = {baseDirectories: baseDirectories}
      jsonfile.writeFileSync(Files.CACHE, result, {spaces: 2})
      return result
    }
  }
}
export default Rails
