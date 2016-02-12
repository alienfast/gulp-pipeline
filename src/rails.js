import ChildProcess from 'child_process'
import path from 'path'
import spawn from 'cross-spawn'

import stringify from 'stringify-object'


const Rails = class {
  static filePath(name) {
    return path.join(__dirname, `rails/${name}`)
  }

  static enumerateEngines() {

    //let rvm = null
    //ChildProcess.exec(`rvm env --path -- ruby-version`, (error, stdout, stderr) => {
    //  if (stdout) {
    //    console.log('stdout: ' + stdout)
    //  }
    //  if (stderr) {
    //    console.log('stderr: ' + stderr)
    //  }
    //  if (error) {
    //    console.log('error: ' + error)
    //  }
    //  rvm = stdout
    //})

    //let processCwd = path.resolve(process.cwd())
    //console.log(`processCwd: ${processCwd}`)
    //
    //console.log(`Running command: `)
    //let results = ChildProcess.execFileSync(this.filePath('railsRunner.sh'), [processCwd, this.filePath('enumerateEngines.rb')], {cwd: processCwd})
    let results = spawn.sync(this.filePath('railsRunner.sh'), [this.filePath('enumerateEngines.rb')], {sdtio: 'inherit'})


    console.log(`Results: ${stringify(results)}`)
  }
}

export default Rails
