import BasePublish from './basePublish'
import Npm from 'build-control/src/npm'
import extend from 'extend'

const Default = {
  task: {
    name: 'publishNpm',
    help: 'Publishes package on npm'
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
const PublishNpm = class extends BasePublish {

  /**
   *
   * @param gulp - gulp instance
   * @param config - customized overrides
   */
  constructor(gulp, preset, config = {}) {
    super(gulp, preset, extend(true, {}, Default, config))
  }

  run() {
    let npm = new Npm(this.config.options)
    npm.publish()
  }
}

export default PublishNpm
