import BasePublish from './basePublish'
import BuildControl from 'build-control/src/buildControl'
import extend from 'extend'

const Default = {
  task: {
    name: 'prepublish',
    help: 'Checks tag name and ensures directory has all files committed.'
  },
  tagExistsError: false
}

/**
 *  This recipe will run a preflight check on publishing to ensure tag name and commits are ready to go.
 *
 *  Run this before long running tests to error your build quickly.
 */
const Prepublish = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  run() {

    let buildControl = new BuildControl(this.config.options)
    buildControl.prepublishCheck(this.config.tagExistsError)
  }
}

export default Prepublish
