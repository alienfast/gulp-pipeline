import extend from 'extend'

// NOTE: `source` and `watch` are node-glob options hashes. e.g. gulp.src(source.glob, source.options)


const Rails = {
  javascripts: {
    source: {options: {cwd: './app/assets/javascripts'}},
    watch: {options: {cwd: './app/assets/javascripts'}}
  },
  stylesheets: {
    source: {options: {cwd: './app/assets/stylesheets'}},
    watch: {options: {cwd: './app/assets/stylesheets'}},
    dest: './public/stylesheets'
  }
}

const NodeLib = {
  javascripts: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}}
  },
  stylesheets: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}},
    dest: './dist'
  }
}

const NodeSrc = {
  javascripts: {
    source: {options: {cwd: './src'}},
    watch: {options: {cwd: './src'}}
  },
  stylesheets: {
    source: {options: {cwd: './src'}},
    watch: {options: {cwd: './src'}},
    dest: './dist'
  }
}

const Platform = class {
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
export default Platform