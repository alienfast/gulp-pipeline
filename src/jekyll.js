import BaseRecipe from './baseRecipe'
import tmp from 'tmp'
import fs from 'fs-extra'
import process from 'process'
import Ruby from './ruby/ruby'

const Default = {
  debug: true,
  watch: false,
  presetType: 'macro',
  task: {
    name: 'jekyll',
    help: 'Builds a jekyll site'
  },
  cwd: process.cwd(),
  options: {
    baseCommand: 'bundle exec',
    config: '_config.yml',
    incremental: false,
    raw: undefined // 'baseurl: "/bootstrap-material-design"'
  }
}

const Jekyll = class extends BaseRecipe {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, Default, ...configs)
  }

  run() {
    let config = `--config ${this.config.options.config}`

    let rawConfigFile = this.rawConfig()

    // Insert temporary config path into the config option
    if (rawConfigFile) {
      config += `,${rawConfigFile}`
    }

    this.exec(`${Ruby.localPath(('rubyRunner.sh'))} ${this.config.options.baseCommand} jekyll build ${config}`)
  }

  // Create temporary config file if needed
  rawConfig() {
    if (this.config.options.raw) {
      // Tmp file is only available within the context of this function
      let tmpFile = tmp.fileSync({prefix: '_config.', postfix: '.yml'})

      // Write raw to file
      fs.writeFileSync(tmpFile.path, this.config.options.raw)

      // return the file path
      return tmpFile.path
    }
    else {
      return null
    }
  }
}

export default Jekyll
