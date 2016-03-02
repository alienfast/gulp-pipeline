import Base from './base'
import gulpHelp from 'gulp-help'
import console from 'console'

export const Default = {
  watch: true,
  debug: false
}

const BaseGulp = class extends Base{

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, ...configs) {
    super(...configs)
    this.gulp = gulpHelp(gulp, {afterPrintCallback: () => console.log(`For configuration help see https://github.com/alienfast/gulp-pipeline \n`)}) // eslint-disable-line no-console
  }
}

export default BaseGulp
