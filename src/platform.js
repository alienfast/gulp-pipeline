import extend from 'extend'

const Rails = {
  javascripts: {
    source: {options: {cwd: './app/assets/javascripts'}},
    watch: {options: {cwd: './app/assets/javascripts'}}
  },
  stylesheets: {
    source: {options: {cwd: './app/assets/stylesheets'}},
    watch: {options: {cwd: './app/assets/stylesheets'}}
  }
}

const NodeLib = {
  javascripts: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}}
  },
  stylesheets: {
    source: {options: {cwd: './lib'}},
    watch: {options: {cwd: './lib'}}
  }
}

const NodeSrc = {
  javascripts: {
    source: {options: {cwd: './src'}},
    watch: {options: {cwd: './src'}}
  },
  stylesheets: {
    source: {options: {cwd: './src'}},
    watch: {options: {cwd: './src'}}
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
