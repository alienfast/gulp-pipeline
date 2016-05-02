import BasePublish from './basePublish'
import {BuildControl} from 'build-control'

const Default = {
  task: {
    name: 'prepublish',
    description: 'Checks tag name and ensures directory has all files committed.'
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
    super(gulp, preset, Default, ...configs)
  }

  run(done) {
    let buildControl = new BuildControl(this.config.options)
    buildControl.prepublishCheck()

    this.donezo(done)
  }
}

export default Prepublish
