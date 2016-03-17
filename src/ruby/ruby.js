import path from 'path'
import fs from 'fs'

const Ruby = class {
  static localPath(name) {
    let filename = `${name}`

    // if using source dir
    let filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    try {
      fs.statSync(filepath)
    }
    catch (error) {
      // if using dist dir
      filepath = path.join(__dirname, '../../src', filename) // eslint-disable-line no-undef
      fs.statSync(filepath)
    }

    return filepath
  }
}

export default Ruby
