import path from 'path'
import File from '../util/file'

const Ruby = class {
  static localPath(name) {
    let filename = `${name}`

    // if using source dir
    let filepath = path.join(__dirname, filename) // eslint-disable-line no-undef
    if(!File.exists(filepath)){

      // if using dist dir, use the relative src/ruby path
      filepath = path.join(__dirname, '../src/ruby', filename) // eslint-disable-line no-undef
      if(!File.exists(filepath)) {
        throw new Error(`Expected to find ${filepath}`)
      }
    }

    return filepath
  }
}

export default Ruby
