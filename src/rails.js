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
}

export default Rails
