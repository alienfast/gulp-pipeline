import BasePublish from './basePublish'
import BuildControl from 'build-control/src/buildControl'
import extend from 'extend'

const Default = {
  task: {
    name: 'prepublish',
    help: 'Checks tag name and ensures directory has all files committed.'
  },
  options: {
    tag: {
      existsFailure: true
    }
  }
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
  constructor(gulp, preset, ...configs) {
    super(gulp, preset, extend(true, {}, Default, ...configs))
  }

  run() {
    let buildControl = new BuildControl(this.config.options)
    buildControl.prepublishCheck()
  }
}

export default Prepublish
