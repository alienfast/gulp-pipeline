import Base from '../base'
//import fs from 'fs-extra'
//import path from 'path'
//import fileSyncCmp from 'file-sync-cmp'
//import process from 'process'
//import iconv from 'iconv-lite'
//import Buffer from 'buffer'
//
//const isWindows = (process.platform === 'win32')
//const pathSeparatorRe = /[\/\\]/g;

/**
 * Implementation can use our base class, but is exposed as static methods in the exported File class
 *
 * TODO: reducing the amount of code by using other maintained libraries would be fantastic.  Worst case, break most of this into it's own library?
 *
 *  @credit to grunt for the grunt.file implementation. See license for attribution.
 */
const Implementation = class extends Base {
  constructor(config) {
    super(config)
  }

  // Read a file, optionally processing its content, then write the output.
  copy(srcpath, destpath, options) {
    if (!options) {
      options = {}
    }
    // If a process function was specified, and noProcess isn't true or doesn't match the srcpath, process the file's source.
    let process = options.process && options.noProcess !== true && !(options.noProcess && this.isMatch(options.noProcess, srcpath))
    // If the file will be processed, use the encoding as-specified. Otherwise, use an encoding of null to force the file to be read/written as a Buffer.
    let readWriteOptions = process ? options : {encoding: null}
    // Actually read the this.
    let contents = this.read(srcpath, readWriteOptions)
    if (process) {
      this.debug('Processing source...')
      try {
        contents = options.process(contents, srcpath)
      }
      catch (e) {
        this.notifyError('Error while processing "' + srcpath + '" this.', e)
      }
    }
    // Abort copy if the process function returns false.
    if (contents === false) {
      this.debug('Write aborted.')
    } else {
      this.write(destpath, contents, readWriteOptions)
    }
  }

  syncTimestamp(src, dest) {
    let stat = fs.lstatSync(src)
    if (path.basename(src) !== path.basename(dest)) {
      return
    }

    if (stat.isFile() && !fileSyncCmp.equalFiles(src, dest)) {
      return
    }

    let fd = fs.openSync(dest, isWindows ? 'r+' : 'r')
    fs.futimesSync(fd, stat.atime, stat.mtime)
    fs.closeSync(fd)
  }

  write(filepath, contents, options) {
    if (!options) {
      options = {}
    }
    // Create path, if necessary.
    this.mkdir(path.dirname(filepath))
    try {
      // If contents is already a Buffer, don't try to encode it. If no encoding
      // was specified, use the default.
      if (!Buffer.isBuffer(contents)) {
        contents = iconv.encode(contents, options.encoding || this.defaultEncoding)
      }
      // Actually write this.
      fs.writeFileSync(filepath, contents)

      return true
    }
    catch (e) {
      this.notifyError('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').', e)
    }
  }

  // Read a file, return its contents.
  read(filepath, options) {
    if (!options) {
      options = {}
    }
    let contents
    this.debug('Reading ' + filepath + '...')
    try {
      contents = fs.readFileSync(String(filepath))
      // If encoding is not explicitly null, convert from encoded buffer to a
      // string. If no encoding was specified, use the default.
      if (options.encoding !== null) {
        contents = iconv.decode(contents, options.encoding || this.defaultEncoding)
        // Strip any BOM that might exist.
        if (!this.config.preserveBOM && contents.charCodeAt(0) === 0xFEFF) {
          contents = contents.substring(1)
        }
      }

      return contents
    }
    catch (e) {
      this.notifyError('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').', e)
    }
  }

  /**
   * Like mkdir -p. Create a directory and any intermediary directories.
   * @param dirpath
   * @param mode
   */
  mkdir(dirpath, mode) {
    // Set directory mode in a strict-mode-friendly way.
    if (mode == null) {
      mode = parseInt('0777', 8) & (~process.umask())
    }
    dirpath.split(pathSeparatorRe).reduce(function (parts, part) {
      parts += part + '/'
      let subpath = path.resolve(parts)
      if (!this.exists(subpath)) {
        try {
          fs.mkdirSync(subpath, mode)
        }
        catch (e) {
          this.notifyError('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e)
        }
      }
      return parts
    }, '')
  }

  /**
   * Match a filepath or filepaths against one or more wildcard patterns.
   * @returns true if any of the patterns match.
   */
  isMatch(...args) {
    return this.match(...args).length > 0
  }

  exists(...args) {
    let filepath = path.join(...args)
    return fs.existsSync(filepath)
  }

  isDir(...args) {
    let filepath = path.join(...args)
    return this.exists(filepath) && fs.statSync(filepath).isDirectory()
  }

  detectDestType(dest) {
    if (dest.endsWith('/')) {
      return 'directory'
    } else {
      return 'file'
    }
  }
}


const File = class {
  static copy(srcpath, destpath, options) {
    return instance.copy(srcpath, destpath, options)
  }

  static syncTimestamp(src, dest) {
    return instance.syncTimestamp(src, dest)
  }

  static write(filepath, contents, options) {
    return instance.write(filepath, contents, options)
  }

  static read(filepath, options) {
    return instance.read(filepath, options)
  }

  static isDir(...args) {
    return instance.isDir(...args)
  }

  static mkdir(dirpath, mode) {
    return instance.mkdir(dirpath, mode)
  }

  static isMatch(...args) {
    return instance.isMatch(...args)
  }

  static exists(...args) {
    return instance.exists(...args)
  }

  static detectDestType(dest) {
    return instance.detectDestType(dest)
  }
}

//  singleton
let instance = new Implementation({})

export default File
