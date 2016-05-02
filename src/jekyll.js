import BaseRecipe from './baseRecipe'
import tmp from 'tmp'
import fs from 'fs-extra'
import Ruby from './ruby/ruby'

const Default = {
  watch: false,
  presetType: 'macro',
  task: {
    name: 'jekyll',
    description: 'Builds a jekyll site'
  },
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

  run(done) {
    let config = `--config ${this.config.options.config}`

    let rawConfigFile = this.rawConfig()

    // If raw is specified, add the temporary config file to the list of configs passed into the jekyll command
    if (rawConfigFile) {
      config += `,${rawConfigFile}`
    }

    this.exec(`${Ruby.localPath(('rubyRunner.sh'))} ${this.config.options.baseCommand} jekyll build ${config}`)

    this.donezo(done)
  }

  // Create temporary config file if needed
  rawConfig() {
    if (this.config.options.raw) {
      // Tmp file is only available within the context of this function
      let tmpFile = tmp.fileSync({prefix: '_config.', postfix: '.yml'})

      // Write raw to file
      fs.writeFileSync(tmpFile.name, this.config.options.raw)

      // return the file path
      return tmpFile.name
    }
    else {
      return null
    }
  }
}

export default Jekyll
