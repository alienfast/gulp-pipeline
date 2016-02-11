import extend from 'extend'

// NOTE: `source` and `watch` are node-glob options hashes. e.g. gulp.src(source.glob, source.options)

const Rails = {
  javascripts: {
    source: {
      glob: 'application.js',
      options: {cwd: './app/assets/javascripts'}
    },
    watch: {options: {cwd: './app/assets/javascripts'}},
    dest: './public/javascripts'
  },
  stylesheets: {
    source: {options: {cwd: './app/assets/stylesheets'}},
    watch: {options: {cwd: './app/assets/stylesheets'}},
    dest: './public/stylesheets'
  },
  images: {
    source: {options: {cwd: './app/assets/images'}},
    watch: {options: {cwd: './app/assets/images'}},
    dest: './public/images'
  }
}

const NodeLib = {
  javascripts: {
    source: {
      glob: 'index.js',
      options: {cwd: './lib'}
    },
    watch: {options: {cwd: './lib'}},
    dest: './dist'
  },
  stylesheets: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}},
    dest: './dist'
  },
  images: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}},
    dest: './dist'
  }
}

const NodeSrc = {
  javascripts: {
    source: {
      glob: 'index.js',
      options: {cwd: './src'}
    },
    watch: {options: {cwd: './src'}},
    dest: './dist'
  },
  stylesheets: {
    source: {options: {cwd: './src'}},
    watch: {options: {cwd: './src'}},
    dest: './dist'
  },
  images: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}},
    dest: './dist'
  }
}

const Preset = class {
  static nodeLib(overrides = {}) {
    return extend(true, {}, NodeLib, overrides)
  }

  static nodeSrc(overrides = {}) {
    return extend(true, {}, NodeSrc, overrides)
  }

  static rails(overrides = {}) {
    return extend(true, {}, Rails, overrides)
  }
}
export default Preset
