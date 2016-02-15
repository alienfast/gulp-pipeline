import extend from 'extend'
import Rails from './rails'


// NOTE: `source` and `watch` are node-glob options hashes. e.g. gulp.src(source.glob, source.options)
const PresetRails = {
  baseDirectories: ['./'],
  javascripts: {
    source: {
      glob: 'application.js',
      options: {cwd: 'app/assets/javascripts'}
    },
    watch: {options: {cwd: 'app/assets/javascripts'}},
    dest: 'public'
  },
  stylesheets: {
    source: {options: {cwd: 'app/assets/stylesheets'}},
    watch: {options: {cwd: 'app/assets/stylesheets'}},
    dest: 'public'
  },
  images: {
    source: {options: {cwd: 'app/assets/images'}},
    watch: {options: {cwd: 'app/assets/images'}},
    dest: 'public'
  },
  digest: {
    source: {options: {cwd: 'public'}},
    watch: {options: {cwd: 'public'}},
    dest: 'public/digest'
  }
}
const PresetNodeLib = {
  baseDirectories: ['./'],
  javascripts: {
    source: {
      glob: 'index.js',
      options: {cwd: 'lib'}
    },
    watch: {options: {cwd: 'lib'}},
    dest: 'dist'
  },
  stylesheets: {
    source: {options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}},
    dest: 'dist'
  },
  images: {
    source: {options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}},
    dest: 'dist'
  },
  digest: {
    source: {options: {cwd: 'dist'}},
    watch: {options: {cwd: 'dist'}},
    dest: 'dist/digest'
  }
}

const PresetNodeSrc = {
  baseDirectories: ['./'],
  javascripts: {
    source: {
      glob: 'index.js',
      options: {cwd: 'src'}
    },
    watch: {options: {cwd: 'src'}},
    dest: 'dist'
  },
  stylesheets: {
    source: {options: {cwd: 'src'}},
    watch: {options: {cwd: 'src'}},
    dest: 'dist'
  },
  images: {
    source: {options: {cwd: 'lib'}},
    watch: {options: {cwd: 'lib'}},
    dest: 'dist'
  },
  digest: {
    source: {options: {cwd: 'dist'}},
    watch: {options: {cwd: 'dist'}},
    dest: 'dist/digest'
  }
}

const Preset = class {
  static nodeLib(overrides = {}) {
    return extend(true, {}, PresetNodeLib, overrides)
  }

  static nodeSrc(overrides = {}) {
    return extend(true, {}, PresetNodeSrc, overrides)
  }

  static rails(overrides = {}) {

    return extend(true, {}, PresetRails, Rails.baseDirectories(), overrides)
  }
}
export default Preset
