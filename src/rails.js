import path from 'path'
import spawn from 'cross-spawn'
//import stringify from 'stringify-object'

const Rails = class {
  static filePath(name) {
    return path.join(__dirname, `rails/${name}`) // eslint-disable-line no-undef
  }

  static enumerateEngines() {
    let results = spawn.sync(this.filePath('railsRunner.sh'), [this.filePath('enumerateEngines.rb')], {sdtio: 'inherit'})
    return JSON.parse(results.output[1])
  }

  static baseDirectories() {
    // FIXME:  Rails engines only need to be resolved when the gemfile.lock has changed, need to cache this list to speed up subsequent runs
    let engines = Rails.enumerateEngines()
    //console.log(stringify(engines))

    let baseDirectories = ['./']
    for (let key of Object.keys(engines)) {
      baseDirectories.push(engines[key])
    }
    //console.log(stringify(baseDirectories))

    return {baseDirectories: baseDirectories}
  }
}

export default Rails
